"use strict";


// ****************************************************************************
// LISTENERS/FUNCTIONS FOR ADDING A NEW TAG

const $addTagButton = $("#add-tag-button");
const $tag = $("#tag");
const $description = $("#description");
const $tagList = $("#tag-list");
const $addTagModal = $("#add-tag-modal")
const $openTagModal = $("#open-tag-modal")

$openTagModal.hide();

/**
 * callback for button to show the add new tag form; auto-populates the tag 
 * name field in the modal based on the search term.
 */
function addNewTagNameToModal() {
    $tag.val($tagSearch.val());
}

$openTagModal.on("click", addNewTagNameToModal);

/**
 * controller/callback for adding a new tag from the modal pop-up
 * @param {event} event 
 */
async function handleNewTagFormSubmit(event) {
    event.preventDefault();
    const response = await postNewTag();
    if (response.status === "success") {
        $addTagModal.modal("hide");
        $openTagModal.hide();
        
        updateDOMWithNewTag(response);

        flashMessage(response.flash.style, response.flash.message, "top");
    } else {
        flashMessage(response.flash.style, response.flash.message, "modal");
    }
}

$addTagButton.on("click", handleNewTagFormSubmit)

/**
 * handles AJAX post to API for a new tag. response varries depending if post 
 * was successful or not. successful post will include the tag and its ID; 
 * unsuccesful will include flash message, rendered above.
 * @returns data object
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
 * updates DOM with the new tag; tag button functionality will depend on where
 * new tag is being added ("tags" or "post" page).
 * @param {object} newTag - the tag object returned from the API. 
 */
function updateDOMWithNewTag(newTag) {
    if ($tagSearch.data("loc") === "tags") {
        $tagList.prepend(`
            <a class="btn btn-sm btn-info m-1" href="/tags/${newTag.tag}">
                ${newTag.tag} (0)
            </a>
        `);
    } else if ($tagSearch.data("loc") === "post") {
        $tagList.prepend(`
            <a class="add-tag-to-post btn btn-sm btn-info m-1" href="" data-tag-id="${newTag.id}">
                ${newTag.tag} (0)
            </a>
        `);

        addTagIdToHiddenInput(newTag.id);
    }

    $tag.val("");
    $description.val("");
}


// *****************************************************************************
// LISTENERS/FUNCTIONS FOR TAG SEARCH

const $tagSearch = $("#tag_search");

/**
 * controller/callback for typing in the tag search field; updates display list
 * of tags based on search.
 */
async function handleTagSearch() {
    const response = await getTagSearchResults();
    updatedDOMWithSearchTags(response);
    if (response.length) {
        $openTagModal.hide();
    } else {
        $openTagModal.show();
    }
}

$tagSearch.on("keyup", handleTagSearch);

/**
 * handles AJAX get request for list of tags that match the provided search 
 * term/snippet.
 * @returns data object of rendered HTML to add to the page.
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
 * updates DOM with results of tag search
 * @param {arrau} tags - array of rendered HTML for each tag. 
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

        if (pickedTags.includes(tagId.toString())) {
            $btn.toggleClass("btn-outline-secondary").toggleClass("btn-info")
        }
    })
}


// *****************************************************************************
// ADD TAGS TO POST

const $tagIdsInput = $("#tag_ids");

/**
 * controller/callback for clicking tag buttons on the "post" page; checks if 
 * clicked tag is already in the list of tag ids, and either adds/removes
 * accordingly.
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

        return;
    }

    addTagIdToHiddenInput(tagId);    
}

$tagList.on("click", ".add-tag-to-post", handleChooseTagForPost);

/**
 * adds a clicked tag's id to the list included in the hidden form input,
 * which is parsed on the server side for adding the correct tags to the new
 * post.
 * @param {integer} tagId - cliked tag's ID 
 */
function addTagIdToHiddenInput(tagId) {
    if ($tagIdsInput.val()) {
        $tagIdsInput.val($tagIdsInput.val() + `,${tagId}`);
    } else {
        $tagIdsInput.val(`${tagId}`)
    }
}