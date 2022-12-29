"use strict";


// ****************************************************************************
// LISTENERS/FUNCTIONS FOR GETTING POSTS

const $postList = $("#posts");
const $loadPostsButton = $("#load-posts");

let morePostsToLoad = true;
let loadingPosts = false;

const INFINITE_SCROLL_PAGE_BOTTOM_ADJUSTMENT = 100;

/**
 * controller/callback for getting more posts and adding them to the bottom
 * of the post list; currently triggered on "load more" button click. works for
 * all post pages - home, user, tags.
 */
async function handleGetMorePosts() {
    loadingPosts = true;
    const posts = await getPosts();

    if (posts.length) {
        updateDOMWithPosts(posts);
        const pageCount = $postList.data("pages");
        $postList.data("pages", pageCount + 1);
    } else {
        flashMessage("success", "all posts loaded!", "bot");
        $loadPostsButton.addClass("d-none");

        morePostsToLoad = false;
    }

    loadingPosts = false;
}

$loadPostsButton.on("click", handleGetMorePosts);

/**
 * intermediate function for infinite scroll functionality when the bottom of 
 * the page is reached; callback for the $(window).scroll event.
 */
function infiniteScroll() {
    const atBottom = (
        $(window).scrollTop() + $(window).height() > 
        $(document).height() - INFINITE_SCROLL_PAGE_BOTTOM_ADJUSTMENT
    );

    if(atBottom && morePostsToLoad && !loadingPosts) {
        console.log("infinite scroll")
        handleGetMorePosts();
    }
}

$(window).on("scroll", infiniteScroll);

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