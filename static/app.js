"use strict";

const API_ENDPOINT_URL = "http://localhost:5001/api";
const mytoken = "{{ csrf_token() }}";


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
*/