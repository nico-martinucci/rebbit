"use strict";

const API_ENDPOINT_URL = "https://rebbit.onrender.com/api";
// const API_ENDPOINT_URL = "http://localhost:5001/api";
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















