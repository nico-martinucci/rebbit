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

    const postId = $("#post").data("post-id");
    const commentText = $commentBox.val();
    const parentCommentId = $commentBox.closest("article").data("comment-id")
    
    const comment_data = await postNewComment(postId, commentText, parentCommentId);

    updatedDOMWithNewComment(comment_data, $submitButton);
    
}

/**
 * 
 * @param {*} postId 
 * @param {*} commentText 
 * @param {*} parentCommentId 
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
 * 
 * @param {*} comment_data 
 * @param {*} $submitButton 
 */
function updatedDOMWithNewComment(comment_data, $submitButton) {
    const $commentBox = $submitButton.prev().children(".comment-text")
    
    if (comment_data.parent_comment_id === -1) {
        $("#comments").prepend($(comment_data.html));
    } else {
        $commentBox.closest("form").next(".replies").prepend($(comment_data.html));
        
        $submitButton.parent().prev("p").toggleClass("d-none");
        $submitButton.parent().toggleClass("d-none");
    }
    
    $commentBox.val("");
}

$("body").on("click", ".add-comment", handleNewCommentFormSubmit);

// *****************************************************************************
// LISTNERS/FUNCTIONS FOR COMMENT REPLY FORMS/LOADING 

/**
 * 
 * @param {*} event 
 */
function showCommentReplyForm(event) {
    event.preventDefault();
    
    $(event.target).closest("p").next("form").toggleClass("d-none");
    $(event.target).closest("p").toggleClass("d-none");
}

$("body").on("click", ".show-reply-form", showCommentReplyForm);

/**
 * 
 * @param {*} event 
 */
function closeReplyForm(event) {
    event.preventDefault();
    
    $(event.target).parent().prev("p").toggleClass("d-none");
    $(event.target).parent().toggleClass("d-none");
}

$("body").on("click", ".close-reply-form", closeReplyForm);

/**
 * 
 * @param {*} event 
 */
async function handleGetCommentReplies(event) {
    event.preventDefault();
    
    const commentId = $(event.target).closest("article").data("comment-id");
    
    const response = await axios({
        url: `${API_ENDPOINT_URL}/comments/${commentId}/children`,
        method: "GET"
    })
    
    const comments = response.data;
    const $replies = $(event.target).closest("p").nextAll(".replies");
    
    $replies.empty();
    
    for (let comment of comments) {
        $replies.append($(comment.html));
    }
}

$("body").on("click", ".show-replies", handleGetCommentReplies);