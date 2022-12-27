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
// LISTENERS/FUNCTIONS FOR GETTING POSTS

const $postList = $("#posts");
const $loadPostsButton = $("#load-posts")

/**
 * controller/callback for getting more posts and adding them to the bottom
 * of the post list; currently triggered on "load more" button click. works for
 * all post pages - home, user, tags.
 */
async function handleGetMorePosts() {
    const posts = await getPosts();

    if (posts.length) {
        updateDOMWithPosts(posts);
        const pageCount = $postList.data("pages");
        $postList.data("pages", pageCount + 1);
    } else {
        flashMessage("success", "all posts loaded!", "bot");
        $loadPostsButton.addClass("d-none");
    }
}

$loadPostsButton.on("click", handleGetMorePosts);

/**
 * AJAX get request to get more posts.
 * @returns array of rendered HTML, one for each post in batch.
 */
async function getPosts() {
    const response = await axios.get(
        `${API_ENDPOINT_URL}/posts`,
        {
            params: {
                offset: $postList.data("pages"),
                filter: $postList.data("filter"),
                info: $postList.data("filter-info")
            }
        }
    )

    return response.data;
}

/**
 * updates DOM with array of rendered posts
 * @param {array} posts - array of rendered HTML snippets, one for each post.
 */
function updateDOMWithPosts(posts) {
    for (let post of posts) {
        $postList.append($(post.html));
    }
}


// ****************************************************************************
// LISTENERS/FUNCTIONS FOR GETTING COMMENTS

const $commentList = $("#comments");
const $loadCommentsButton = $("#load-comments")

/**
 * controller/callback for getting more comments and adding them to the bottom
 * of the comment list; currently triggered on "load more" button click.
 */
async function handleGetMoreComments() {
    const comments = await getMoreComments();

    if (comments.length) {
        updateDOMWithComments(comments);
        const pageCount = $commentList.data("pages");
        $commentList.data("pages", pageCount + 1);
    } else {
        flashMessage("success", "all comments loaded!", "bot");
        $loadCommentsButton.addClass("d-none");
    }
}

$loadCommentsButton.on("click", handleGetMoreComments);

/**
 * AJAX get request to get more comments.
 * @returns array of rendered HTML, one for each comment in batch.
 */
async function getMoreComments() {
    const response = await axios.get(
        `${API_ENDPOINT_URL}/posts/${postId}/comments`,
        {
            params: {
                offset: $commentList.data("pages")
            }
        }
    )

    return response.data;
}

/**
 * updates DOM with array of rendered comments
 * @param {array} comments - array of rendered HTML snippets, one for 
 * each comment.
 */
function updateDOMWithComments(comments) {
    for (let comment of comments) {
        $commentList.append($(comment.html));
    }
}


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
// LISTENERS/FUNCTIONS FOR ADDING A NEW COMMENT

/**
 * controller function to handle submission of a new comment on a post; 
 * run on click of comment "submit" button.
 * @param {event} event 
*/
async function handleNewCommentFormSubmit(event) {
    event.preventDefault();
    
    const $commentBox = $(event.target).prev().children(".comment-text")
    const $submitButton = $(event.target);

    const postId = $("#post").data("id");
    const commentText = $commentBox.val();
    const parentCommentId = $commentBox.closest("article").data("id")
    
    const commentData = await postNewComment(postId, commentText, parentCommentId);

    updatedDOMWithNewComment(commentData.html, parentCommentId, $submitButton);
    // TODO: change this so it only fires if successful
    flashMessage(commentData.flash.style, commentData.flash.message, "top");
}

$("body").on("click", ".add-comment", handleNewCommentFormSubmit);

/**
 * handles AJAX request for posting a new comment; gets back HTML of the new 
 * comment to add to the DOM
 * @param {integer} postId - ID of the post that the comment is on
 * @param {string} commentText - text entered into the comment box
 * @param {integer} parentCommentId - ID of the parent comment being replied to;
 * -1 if a top-level reply to the post
 * @returns data object with HTML to inject and parent comment ID 
 */
async function postNewComment(postId, commentText, parentCommentId) {
    const response = await axios({
        url: `${API_ENDPOINT_URL}/posts/${postId}/comments`,
        method: "POST",
        data: {
            content: commentText,
            parent_comment_id: parentCommentId,
            csrf_token: mytoken
        }
    })
    
    return response.data;
}

/**
 * adds new comment to the DOM; if top-level, adds it to the top of the comments
 * section; if a reply, adds it to the replies section of the comment replied to
 * @param {string} commentHtml - injectable HTML for the comment
 * @param {integer} parentCommentId - ID of the parent comment being replied to;
 * -1 if a top-level reply to the post
 * @param {jQuery object} $submitButton - target of the click; used to find 
 * replies section of comment for reply comments
 */
function updatedDOMWithNewComment(commentHtml, parentCommentId, $submitButton) {
    const $commentBox = $submitButton.prev().children(".comment-text")
    
    if (parentCommentId === -1) {
        $("#comments").prepend($(commentHtml));
    } else {
        $commentBox.closest("form").next(".replies").prepend($(commentHtml));
        
        $submitButton.parent().prev("p").toggleClass("d-none");
        $submitButton.parent().toggleClass("d-none");
    }
    
    $commentBox.val("");
}


// *****************************************************************************
// LISTNERS/FUNCTIONS FOR COMMENT REPLY FORMS/LOADING 

/**
 * callback for clicking "reply" on a comment; shows reply form and hides links
 * @param {event} event 
 */
function showCommentReplyForm(event) {
    event.preventDefault();
    
    // show reply form
    $(event.target).closest("p").next("form").toggleClass("d-none");
    // hide list of actions at bottom of comment
    $(event.target).closest("p").toggleClass("d-none");
}

$("body").on("click", ".show-reply-form", showCommentReplyForm);

/**
 * callback for clicking "cancel" on reply form; hides form and shows links
 * @param {event} event 
 */
function closeReplyForm(event) {
    event.preventDefault();
    
    $(event.target).parent().prev("p").toggleClass("d-none");
    $(event.target).parent().toggleClass("d-none");
}

$("body").on("click", ".close-reply-form", closeReplyForm);

/**
 * callback/controller for getting a list of first-level comment replies and 
 * adding them to the DOM under the correct comment.
 * @param {event} event 
 */
async function handleGetCommentReplies(event) {
    event.preventDefault();
    
    const commentId = $(event.target).closest("article").data("id");
    const comments = await getComments(commentId);

    updateDOMWithCommentReplies($(event.target), comments);
}

$("body").on("click", ".show-replies", handleGetCommentReplies);

/**
 * handles AJAX request for getting a list of first-level comment replies
 * @param {integer} commentId - id of comment for which to get replies
 * @returns array of injectable HTML for each comment reply
 */
async function getComments(commentId) {
    const response = await axios({
        url: `${API_ENDPOINT_URL}/comments/${commentId}/children`,
        method: "GET"
    })
    
    return response.data;
}

/**
 * updates DOM with list of comment replies
 * @param {jQuery object} target - the clicked submit button; used to find the
 * correct replies section
 * @param {array} comments - array of injectable HTML for each comment
 */
function updateDOMWithCommentReplies(target, comments) {
    const $replies = target.closest("p").nextAll(".replies");
    $replies.empty();
    
    for (let comment of comments) {
        $replies.append($(comment.html));
    }
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