"use strict";

const API_ENDPOINT_URL = "http://localhost:5000/api";
const mytoken = "{{ csrf_token() }}";

const FLASH_MESSAGE_LIFE_MILLISECONDS = 3000;

const $topFlashMessages = $("#top-flash-messages");
const $botFlashMessages = $("#bot-flash-messages");
const $modalFlashMessages = $("#modal-flash-messages");

const postId = $("#post").data("id");


// ****************************************************************************
// LISTENER FOR PAGE LOAD

$(window).on("load", () => {
    clearFlashMessages();
})


// ****************************************************************************
// LISTENERS/FUNCTIONS FOR ADDING A NEW TAG

const $addTagButton = $("#add-tag-button");
const $tag = $("#tag");
const $description = $("#description");
const $tagList = $("#tag-list");
const $addTagModal = $("#add-tag-modal")

/**
 * 
 * @param {*} event 
 */
async function handleNewTagFormSubmit(event) {
    event.preventDefault();
    const response = await postNewTag();
    if (response.status === "success") {
        updateDOMWithNewTag(response.tag);
        $addTagModal.modal("hide");
        flashMessage(response.flash.style, response.flash.message, "top");
    } else {
        flashMessage(response.flash.style, response.flash.message, "modal");
    }
}

$addTagButton.on("click", handleNewTagFormSubmit)

/**
 * 
 * @returns 
 */
async function postNewTag() {
    const response = await axios({
        url: `${API_ENDPOINT_URL}/tags`,
        method: "POST",
        data: {
            tag: $tag.val(),
            description: $description.val()
        }
    })
    
    return response.data;
}

/**
 * 
 * @param {*} newTag 
 */
function updateDOMWithNewTag(newTag) {
    $tagList.prepend(`
        <a class="btn btn-sm btn-info m-1" href="/tags/${newTag}">
            ${newTag} (0)
        </a>`
    );

    $tag.val("");
    $description.val("");
}







// *****************************************************************************
// API CALL FOR PULLING URL INFORMATION

const $urlField = $("#url")
$urlField.on("focusout", getUrlData);

/**
 * gets title and image link from provided URL for auto-populating form.
 */
async function getUrlData() {
    const response = await axios.get(
        `${API_ENDPOINT_URL}/posts/get-data`,
        {
            params: {
                url: $urlField.val()
            }
        }
    )

    $("#title").val(response.data.h1);
    $("#img_url").val(response.data.img_url);
}


// *****************************************************************************
// LISTENERS FOR RESPONSIVE ELEMENTS

/**
 * toggles on the "fill" version of the arrow icons when mouseover.
 * @param {event} event 
 */
function toggleVoteIconOn(event) {
    const icon = $(event.target);
    if (icon.hasClass("bi-arrow-up-circle")) {
        $(event.target)
            .toggleClass("bi-arrow-up-circle")
            .toggleClass("bi-arrow-up-circle-fill")
    }
    if (icon.hasClass("bi-arrow-down-circle")) {
        $(event.target)
            .toggleClass("bi-arrow-down-circle")
            .toggleClass("bi-arrow-down-circle-fill")
    }
}

$("body").on("mouseover", ".vote", toggleVoteIconOn)


/**
 * toggles off the "fill" verison of the arrow icons when mouseout.
 * @param {event} event 
 */
function toggleVoteIconOff(event) {
    const icon = $(event.target);
    if (icon.hasClass("bi-arrow-up-circle-fill")) {
        $(event.target)
            .toggleClass("bi-arrow-up-circle")
            .toggleClass("bi-arrow-up-circle-fill")
    }
    if (icon.hasClass("bi-arrow-down-circle-fill")) {
        $(event.target)
            .toggleClass("bi-arrow-down-circle")
            .toggleClass("bi-arrow-down-circle-fill")
    }
}

$("body").on("mouseout", ".vote", toggleVoteIconOff)


/**
 * controller/callback for handling voting on posts and comments.
 * @param {event} event 
 */
async function handlePostVote(event) {
    const $voteButton = $(event.target);

    const content_type = $voteButton.closest("article").data("content-type");
    const content_id = $voteButton.closest("article").data("id");

    const newScore = await postVote(content_type, content_id, $voteButton);   

    updateDOMWithVoteInfo(newScore, $voteButton);
}

$("body").on("click", ".vote", handlePostVote)

/**
 * makes API call to server, posting new vote info and getting back the new
 * score of the comment/post
 * @param {string} content_type - whether liked content is a "post" or "comment"
 * @param {integer} content_id - id of the content liked/unliked
 * @param {jQuery object} $voteButton - jQuery obj of the clicked vote icon
 * @returns 
 */
async function postVote(content_type, content_id, $voteButton) {
    const response = await axios({
        url: `${API_ENDPOINT_URL}/${content_type}/${content_id}/vote`,
        method: "POST",
        data: {
            vote: $voteButton.data("vote")
        }
    })

    return response.data.score;
}

/**
 * updates DOM with new vote information; toggles button classes to show user
 * their current vote on a post/comment.
 * @param {string} newScore - new numerical score to display
 * @param {jQuery object} $voteButton - jQuery obj of the clicked vote icon
 */
function updateDOMWithVoteInfo(newScore, $voteButton) {
    const $voteTotal = $voteButton.siblings(".vote-total");
    $voteTotal.html(`<b>${newScore}</b>`);

    if ($voteButton.hasClass("bi-arrow-up-circle-fill") || $voteButton.hasClass("bi-arrow-up-circle")) {
        $voteButton.toggleClass("text-primary");
        $voteButton.siblings(".bi-arrow-down-circle").removeClass("text-danger")
    }
    
    if ($voteButton.hasClass("bi-arrow-down-circle-fill") || $voteButton.hasClass("bi-arrow-down-circle")) {
        $voteButton.toggleClass("text-danger");
        $voteButton.siblings(".bi-arrow-up-circle").removeClass("text-primary")
    }
}

/**
 * adds a flask-style flash message to the provided flash message location
 * @param {string} style - Bootstrap keyword for style of message (e.g. 
 * "success", "warning", etc.)
 * @param {string} message - message to display
 * @param {string} loc - location of message - currently "top", "bot", or 
 * "modal"
 */
function flashMessage(style, message, loc) {
    if (loc === "top") {
        $topFlashMessages.html($(`
            <div class="alert alert-${style}">
                ${message}
            </div>
        `))
    } else if (loc === "bot") {
        $botFlashMessages.html($(`
            <div class="alert alert-${style}">
                ${message}
            </div>
        `))
    } else if (loc === "modal") {
        $modalFlashMessages.html($(`
            <div class="alert alert-${style}">
                ${message}
            </div>
        `))
    }

    clearFlashMessages();
}

/**
 * clears flash messages on the screen after a given lifespan, defined in the
 * constant
 */
function clearFlashMessages() {
    setTimeout(()=> {
        $topFlashMessages.empty()
        $botFlashMessages.empty()
        $modalFlashMessages.empty()
    }, FLASH_MESSAGE_LIFE_MILLISECONDS)
}