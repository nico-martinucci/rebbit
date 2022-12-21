"use strict";

const API_ENDPOINT_URL = "http://localhost:5000/api";
const mytoken = "{{ csrf_token() }}";


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
    
}

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
        url: `${API_ENDPOINT_URL}/posts/${postId}/comment`,
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

$("body").on("click", ".add-comment", handleNewCommentFormSubmit);


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

$("body").on("click", ".show-replies", handleGetCommentReplies);


// *****************************************************************************
// API CALL FOR PULLING URL INFORMATION

const $urlField = $("#url")
$urlField.on("focusout", getUrlData);

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

    console.log(response);
}


// *****************************************************************************
// LISTENERS FOR RESPONSIVE ELEMENTS

/**
 * 
 * @param {*} event 
 */
function toggleVoteIconOn(event) {
    const icon = $(event.target);
    if (icon.hasClass("bi-arrow-up-circle")) {
        $(event.target).toggleClass("bi-arrow-up-circle").toggleClass("bi-arrow-up-circle-fill")
    }
    if (icon.hasClass("bi-arrow-down-circle")) {
        $(event.target).toggleClass("bi-arrow-down-circle").toggleClass("bi-arrow-down-circle-fill")
    }
}

$("body").on("mouseover", ".vote", toggleVoteIconOn)

/**
 * 
 * @param {*} event 
 */
function toggleVoteIconOff(event) {
    const icon = $(event.target);
    if (icon.hasClass("bi-arrow-up-circle-fill")) {
        $(event.target).toggleClass("bi-arrow-up-circle").toggleClass("bi-arrow-up-circle-fill")
    }
    if (icon.hasClass("bi-arrow-down-circle-fill")) {
        $(event.target).toggleClass("bi-arrow-down-circle").toggleClass("bi-arrow-down-circle-fill")
    }
}

$("body").on("mouseout", ".vote", toggleVoteIconOff)

async function postUpvoteDownvote(event) {
    const $voteButton = $(event.target);
    // get content type of article that the vote is in
    const content = $voteButton.closest("article").data("content-type");
    // get the id of the aricle that the vote is in
    const content_id = $voteButton.closest("article").data("id");

    const response = await axios({
        url: `${API_ENDPOINT_URL}/${content}/${content_id}/vote`,
        method: "POST",
        data: {
            vote: $voteButton.data("vote")
        }
    })

    console.log(response);
}

$("body").on("click", ".vote", postUpvoteDownvote)