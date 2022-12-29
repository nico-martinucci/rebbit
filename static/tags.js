"use strict";


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
// LISTENERS/FUNCTIONS FOR TAG SEARCH

const $tagSearch = $("#tag_search");

/**
 * 
 */
async function handleTagSearch() {
    const response = await getTagSearchResults();
    updatedDOMWithSearchTags(response);
}

$tagSearch.on("keyup", handleTagSearch);

/**
 * 
 * @returns 
 */
async function getTagSearchResults() {
    const response = await axios.get(
        `${API_ENDPOINT_URL}/tags`,
        {
            params: {
                term: $tagSearch.val(),
                loc: $tagSearch.data("loc")
            }
        }
    )

    return response.data
}

/**
 * 
 * @param {*} tags 
 */
function updatedDOMWithSearchTags(tags) {
    $tagList.empty();
    for (let tag of tags) {
        $tagList.append(tag.html);
    }

    $(".add-tag-to-post").each((i, elem) => {
        const pickedTags = $tagIdsInput.val().split(",");
        let $btn = $(elem);
        let tagId = $btn.data("tag-id");
        console.log("picked tags: ", pickedTags, "; tagId: ", tagId);
        if (pickedTags.includes(tagId.toString())) {
            $btn.toggleClass("btn-outline-secondary").toggleClass("btn-info")
        }
    })
}


// *****************************************************************************
// ADD TAGS TO POST

const $tagIdsInput = $("#tag_ids");

/**
 * 
 */
function handleChooseTagForPost(event) {
    event.preventDefault();
    
    const pickedTags = $tagIdsInput.val().split(",");
    const $btn = $(event.target);
    const tagId = $btn.data("tag-id");

    $btn.toggleClass("btn-outline-secondary").toggleClass("btn-info")
    
    if (pickedTags.includes(tagId.toString())) {
        pickedTags.splice(pickedTags.indexOf(tagId), 1);
        $tagIdsInput.val(pickedTags.join(","));
        console.log("picked tags: ", pickedTags, "; tagId: ", tagId);
        return;
    }

    if ($tagIdsInput.val()) {
        $tagIdsInput.val($tagIdsInput.val() + `,${tagId}`);
    } else {
        $tagIdsInput.val(`${tagId}`)
    }

}

$tagList.on("click", ".add-tag-to-post", handleChooseTagForPost);