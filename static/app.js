"use strict";

const API_ENDPOINT_URL = "http://localhost:5000/api";
const mytoken = "{{ csrf_token() }}";

// change this to a listener on the entire page, for .add-comment clicks
$("body").on("click", ".add-comment", handleNewCommentFormSubmit);

async function handleNewCommentFormSubmit(event) {
    event.preventDefault();

    const $commentBox = $(event.target).prev().children(".comment-text")

    const postId = $("#post").data("post-id");
    const parentCommentId = $commentBox.closest("article").data("comment-id")

    const response = await axios({
        url: `${API_ENDPOINT_URL}/posts/${postId}/comment`,
        method: "POST",
        data: {
            content: $commentBox.val(),
            parent_comment_id: parentCommentId,
            csrf_token: mytoken
        }
    })

    const comment = response.data;
    console.log(comment);

    if (comment.parent_comment_id === -1) {
        $("#comments").prepend($(comment.html));
    } else {
        $commentBox.closest("form").next(".replies").prepend($(comment.html));
        
        $(event.target).parent().prev("p").toggleClass("d-none");
        $(event.target).parent().toggleClass("d-none");
    }

    $commentBox.val("");
}

$("body").on("click", ".show-reply-form", showCommentReplyForm);

function showCommentReplyForm(event) {
    event.preventDefault();

    $(event.target).closest("p").next("form").toggleClass("d-none");
    $(event.target).closest("p").toggleClass("d-none");
}

$("body").on("click", ".close-reply-form", closeReplyForm);

function closeReplyForm(event) {
    event.preventDefault();
    
    $(event.target).parent().prev("p").toggleClass("d-none");
    $(event.target).parent().toggleClass("d-none");
}

$("body").on("click", ".show-replies", handleGetCommentReplies);

async function handleGetCommentReplies(event) {
    event.preventDefault();

    const commentId = $(event.target).closest("article").data("comment-id");

    const response = await axios({
        url: `${API_ENDPOINT_URL}/comments/${commentId}/children`,
        method: "GET"
    })

    const comments = response.data;
    const $replies = $(event.target).closest("p").nextAll(".replies");

    for (let comment of comments) {
        $replies.append($(comment.html));
    }
}
