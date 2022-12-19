"use strict";

const API_ENDPOINT_URL = "http://localhost:5000/api";
const mytoken = "{{ csrf_token() }}";

// change this to a listener on the entire page, for .add-comment clicks
$("body").on("click", ".add-comment", handleNewCommentFormSubmit);

async function handleNewCommentFormSubmit(event) {
    event.preventDefault();

    const $commentBox = $(event.target).prev().children(".comment-text")

    const post_id = $("#post").data("post-id");
    const parent_comment_id = $commentBox.closest("article").data("parent-comment-id")

    const response = await axios({
        url: `${API_ENDPOINT_URL}/posts/${post_id}/comment`,
        method: "POST",
        data: {
            content: $commentBox.val(),
            parent_comment_id: parent_comment_id,
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
