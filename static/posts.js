"use strict";

// ****************************************************************************
// LISTENERS/FUNCTIONS FOR GETTING POSTS

const $postList = $("#posts");
const $loadPostsButton = $("#load-posts")

/**
 * controller/callback for getting more posts and adding them to the bottom
 * of the post list; currently triggered on "load more" button click. works for
 * all post pages - home, user, tags.
 */
async function handleGetMorePosts() {
    const posts = await getPosts();

    if (posts.length) {
        updateDOMWithPosts(posts);
        const pageCount = $postList.data("pages");
        $postList.data("pages", pageCount + 1);
    } else {
        flashMessage("success", "all posts loaded!", "bot");
        $loadPostsButton.addClass("d-none");
    }
}

$loadPostsButton.on("click", handleGetMorePosts);

/**
 * AJAX get request to get more posts.
 * @returns array of rendered HTML, one for each post in batch.
 */
async function getPosts() {
    const response = await axios.get(
        `${API_ENDPOINT_URL}/posts`,
        {
            params: {
                offset: $postList.data("pages"),
                filter: $postList.data("filter"),
                info: $postList.data("filter-info")
            }
        }
    )

    return response.data;
}

/**
 * updates DOM with array of rendered posts
 * @param {array} posts - array of rendered HTML snippets, one for each post.
 */
function updateDOMWithPosts(posts) {
    for (let post of posts) {
        $postList.append($(post.html));
    }
}