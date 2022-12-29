"use strict";


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