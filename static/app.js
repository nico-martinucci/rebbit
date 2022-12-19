"use strict";

const API_ENDPOINT_URL = "http://localhost:5000/api";
const mytoken = "{{ csrf_token() }}";

$("#add-comment").on("click", handleNewCommentFormSubmit);

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

/* 
async function handleStarClick(event) {
    event.preventDefault();

    const $star = $(event.target)
    const message_id = $star.closest("li").attr("id");

    const response = await axios({
        url: `${API_ENDPOINT_URL}/messages/${message_id}/likes`,
        method: "POST",
        data: {
            csrf_token: mytoken
        }
    })

    $star.toggleClass("bi-star").toggleClass("bi-star-fill")
}

method="POST" action="/posts/{{post.id}}/add-comment"

return {
            "id": self.id,
            "content": self.content,
            "likes": self.likes,
            "created_at": self.created_at,
            "parent_comment_id": self.parent_comment_id,
            "user_id": self.user_id,
            "post_id": self.post_id
        }
*/