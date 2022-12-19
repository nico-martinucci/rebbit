"use strict";

const API_ENDPOINT_URL = "http://localhost:5000/api";
const mytoken = "{{ csrf_token() }}";

// change this to a listener on the entire page, for .add-comment clicks
$(".add-comment").on("click", handleNewCommentFormSubmit);

async function handleNewCommentFormSubmit(event) {
    event.preventDefault();

    const post_id = $("#post").data("post-id");
    console.log(post_id)

    const response = await axios({
        url: `${API_ENDPOINT_URL}/posts/${post_id}/comment`,
        method: "POST",
        data: {
            content: $("#comment-text").val(),
            csrf_token: mytoken
        }
    })

    console.log(response);

    const comment = response.data;

    const $newComment = $(`
        <div class="card flex-row flex-wrap m-2 p-2">
            <div class="card-block px-2">
                <p class="card-text">${comment.content}</p>
                <p class="card-text">
                    <small class="text-muted">
                        by <a href="/users/${comment.user_id}">${comment.username}</a> | 
                        posted on ${comment.created_at}
                    </small>
                </p>
            </div>
        </div>
    `)

    $("#comments").prepend($newComment)

}

