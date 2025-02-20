<script lang="ts">
  import { buildCommentsTreeAsync } from '$lib/components/lemmy/comment/comments.js'
  import Comments from '$lib/components/lemmy/comment/Comments.svelte'
  import { isImage, isVideo } from '$lib/ui/image.js'
  import { getClient } from '$lib/lemmy.js'
  import CommentForm from '$lib/components/lemmy/comment/CommentForm.svelte'
  import { onMount } from 'svelte'
  import Markdown from '$lib/components/markdown/Markdown.svelte'
  import Button from '$lib/components/input/Button.svelte'
  import { page } from '$app/stores'
  import PostActions from '$lib/components/lemmy/post/PostActions.svelte'
  import { ExclamationTriangle, Icon } from 'svelte-hero-icons'
  import Spinner from '$lib/components/ui/loader/Spinner.svelte'
  import Card from '$lib/components/ui/Card.svelte'
  import PostLink from '$lib/components/lemmy/post/PostLink.svelte'
  import PostMeta from '$lib/components/lemmy/post/PostMeta.svelte'
  import { toast } from '$lib/components/ui/toasts/toasts.js'
  import type { CommentSortType } from 'lemmy-js-client'
  import MultiSelect from '$lib/components/input/MultiSelect.svelte'
  import { profile } from '$lib/auth.js'

  export let data

  const postData = data.post.post_view
  const post = postData.post

  onMount(async () => {
    if (!postData.read && $profile?.jwt) {
      getClient().markPostAsRead({
        auth: $profile.jwt,
        read: true,
        post_id: post.id,
      })
    }
  })

  let commentsPage = 1
  let commentSort: CommentSortType = 'Hot'
  let loading = false
  let moreComments = true

  async function reloadComments() {
    data.singleThread = false
    commentsPage = 1

    data.streamed.comments = getClient().getComments({
      auth: $profile?.jwt,
      max_depth: 3,
      page: commentsPage,
      limit: 25,
      type_: 'All',
      post_id: data.post.post_view.post.id,
      sort: commentSort,
    })
  }
</script>

<svelte:head>
  <title>{data.post.post_view.post.name}</title>
  <meta property="og:title" content={data.post.post_view.post.name} />
  <meta property="og:url" content={$page.url.toString()} />
  {#if isImage(post.url)}
    <meta property="og:image" content={post.url} />
  {/if}
  {#if post.body}
    <meta property="og:description" content={post.body} />
  {/if}
</svelte:head>

<div class="flex flex-col gap-2">
  {#if $profile?.user && $page.params.instance.toLowerCase() != $profile.instance.toLowerCase()}
    <Card cardColor="warning" class="p-4 flex flex-col gap-1">
      <Icon
        src={ExclamationTriangle}
        width={24}
        solid
        class="text-yellow-500"
      />
      <h1 class="font-bold">Warning</h1>
      <p class="text-sm">
        This URL is for a different instance than you're logged into. You
        probably won't be able to vote or comment.
      </p>
    </Card>
  {/if}

  <PostMeta
    community={postData.community}
    user={postData.creator}
    upvotes={postData.counts.upvotes}
    downvotes={postData.counts.downvotes}
    deleted={postData.post.deleted}
    removed={postData.post.removed}
    locked={postData.post.locked}
    featured={postData.post.featured_community || postData.post.featured_local}
    nsfw={postData.post.nsfw}
    published={new Date(postData.post.published + 'Z')}
    saved={postData.saved}
  />
  <h1 class="font-bold text-lg">{post.name}</h1>
  {#if isImage(post.url)}
    <img
      src={post.url}
      alt={post.name}
      class="rounded-md max-w-screen max-h-[80svh] mx-auto"
    />
  {:else if isVideo(post.url)}
    <!-- svelte-ignore a11y-media-has-caption -->
    <video class="rounded-md max-w-screen max-h-[80svh] mx-auto" controls>
      <source src={post.url} />
    </video>
  {:else if post.url && !post.thumbnail_url}
    <a
      href={post.url}
      class="max-w-full overflow-hidden overflow-ellipsis whitespace-nowrap text-sky-400 hover:underline text-xs"
    >
      {post.url}
    </a>
  {:else if post.thumbnail_url && post.url}
    <PostLink
      thumbnail_url={post.thumbnail_url}
      url={post.url}
      nsfw={post.nsfw}
    />
  {/if}
  {#if post.body}
    <div
      class="bg-slate-100 border border-slate-200 dark:border-zinc-800
    dark:bg-zinc-900 p-2 text-sm rounded-md leading-[22px]"
    >
      <Markdown source={post.body} />
    </div>
  {/if}
  <div class="w-full relative">
    <PostActions
      post={data.post.post_view}
      on:edit={(e) => {
        post.name = e.detail.post.name
        post.body = e.detail.post.body
        post.url = e.detail.post.url

        toast({
          content: 'The post was edited successfully.',
          type: 'success',
        })
      }}
    />
  </div>
</div>
<div class="mt-4 flex flex-col gap-2">
  <div class="font-bold text-lg">
    Comments <span class="text-sm font-normal ml-2 opacity-80">
      {postData.counts.comments}
    </span>
  </div>
  <MultiSelect
    options={['Hot', 'Top', 'New']}
    bind:selected={commentSort}
    on:select={reloadComments}
  />
  {#if data.singleThread}
    <Card class="py-2 px-4 text-sm flex flex-row items-center flex-wrap gap-4">
      <p>You're viewing a single thread.</p>
      <Button on:click={reloadComments}>View full thread</Button>
    </Card>
  {/if}
  {#await data.streamed.comments}
    <div class="h-16 mx-auto grid place-items-center">
      <Spinner width={24} />
    </div>
  {:then comments}
    {#if $profile?.user}
      <CommentForm
        postId={post.id}
        on:comment={(comment) =>
          (comments.comments = [
            comment.detail.comment_view,
            ...comments.comments,
          ])}
        locked={postData.post.locked}
      />
    {/if}
    {#await buildCommentsTreeAsync(comments.comments)}
      <div class="h-16 mx-auto grid place-items-center">
        <Spinner width={36} />
      </div>
    {:then comments}
      <Comments {post} nodes={comments} isParent={true} />
    {/await}
    {#if moreComments}
      <Button
        {loading}
        disabled={loading}
        color="tertiary"
        on:click={async () => {
          if (!moreComments) return
          loading = true

          const loadedComments = await getClient().getComments({
            auth: $profile?.jwt,
            max_depth: 3,
            page: ++commentsPage,
            limit: 25,
            type_: 'All',
            post_id: data.post.post_view.post.id,
          })

          if (comments.comments == loadedComments.comments) {
            comments.comments = [
              ...comments.comments,
              ...loadedComments.comments.filter(
                (comment) => !comments.comments.includes(comment)
              ),
            ]
          } else {
            moreComments = false
          }

          loading = false
        }}
      >
        Load more
      </Button>
    {/if}
  {:catch}
    <div class="bg-red-500/10 border border-red-500 rounded-md p-4">
      Failed to load comments.
    </div>
  {/await}
</div>
