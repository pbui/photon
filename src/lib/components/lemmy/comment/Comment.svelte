<script lang="ts">
  import {
    ArrowUp,
    Bookmark,
    Icon,
    Minus,
    Pencil,
    Plus,
    Trash,
  } from 'svelte-hero-icons'
  import type { CommentNodeI } from './comments'
  import RelativeDate from '$lib/components/util/RelativeDate.svelte'
  import CommentForm from './CommentForm.svelte'
  import UserLink from '$lib/components/lemmy/user/UserLink.svelte'
  import Markdown from '$lib/components/markdown/Markdown.svelte'
  import CommentActions from '$lib/components/lemmy/comment/CommentActions.svelte'
  import Modal from '$lib/components/ui/modal/Modal.svelte'
  import { getClient } from '$lib/lemmy.js'
  import { toast } from '$lib/components/ui/toasts/toasts.js'
  import { profile } from '$lib/auth.js'

  export let node: CommentNodeI
  export let postId: number
  export let op: boolean = false
  export let actions: boolean = true

  export let open = true
  export let replying = false

  let editing = false
  let newComment = node.comment_view.comment.content
</script>

{#if editing}
  <Modal
    bind:open={editing}
    action="Save"
    on:action={async () => {
      if (!$profile?.jwt || newComment.length <= 0) return

      try {
        await getClient().editComment({
          auth: $profile.jwt,
          comment_id: node.comment_view.comment.id,
          content: newComment,
        })

        node.comment_view.comment.content = newComment

        editing = false

        toast({
          content:
            'Successfully edited comment. You may need to refresh to see changes.',
          type: 'success',
        })
      } catch (err) {
        toast({
          // @ts-ignore i hate this
          content: err,
          type: 'error',
        })
      }
    }}
  >
    <span slot="title">Edit comment</span>
    <CommentForm
      postId={node.comment_view.comment.id}
      bind:value={newComment}
      actions={false}
      preview={true}
    />
  </Modal>
{/if}

<li
  class="py-2 {node.depth == 0
    ? 'border-b border-slate-200 dark:border-zinc-800'
    : ''}"
  id="#{node.comment_view.comment.id.toString()}"
>
  <details bind:open class="flex flex-col gap-1">
    <summary
      class="flex flex-row cursor-pointer gap-2 items-center group text-xs flex-wrap"
    >
      <span class:font-bold={op} class="flex flex-row gap-1 items-center">
        <UserLink
          inComment
          avatarSize={20}
          avatar
          user={node.comment_view.creator}
        />
        {#if op}
          <span class="text-sky-500">OP</span>
        {/if}
      </span>
      <span class="text-slate-600 dark:text-zinc-400 flex flex-row gap-1">
        {#if !open}
          <div
            class="flex items-center gap-0.5 mr-1 text-slate-800 dark:text-zinc-200"
          >
            <Icon src={ArrowUp} mini size="14" />
            {node.comment_view.counts.score}
          </div>
        {/if}
        <RelativeDate
          date={new Date(node.comment_view.comment.published + 'Z')}
        />
        <span>•</span>
        <span>
          {Math.floor(
            (node.comment_view.counts.upvotes /
              (node.comment_view.counts.upvotes +
                node.comment_view.counts.downvotes)) *
              100
          ) || 0}%
        </span>
      </span>
      <span class="text-slate-600 dark:text-zinc-400 flex flex-row gap-2 ml-1">
        {#if node.comment_view.comment.updated}
          <Icon src={Pencil} solid size="12" title="Edited" />
        {/if}
        {#if node.comment_view.comment.deleted || node.comment_view.comment.removed}
          <Icon src={Trash} solid size="12" title="Deleted" />
        {/if}
        {#if node.comment_view.saved}
          <Icon src={Bookmark} solid size="12" title="Saved" />
        {/if}
      </span>
      <span
        class="ml-auto translate-x-1 opacity-0
        group-hover:translate-x-0 group-hover:opacity-100 text-xs transition-all
        flex flex-row items-center gap-1 dark:bg-zinc-900 p-1 rounded-md
        bg-slate-200 hover:brightness-125 px-2"
      >
        {#if open}
          <Icon src={Minus} width={16} height={16} mini />
        {:else}
          <Icon src={Plus} width={16} height={16} mini />
          {#if node.children.length > 0}
            <span class="text-xs opacity-50">+{node.children.length}</span>
          {/if}
        {/if}
      </span>
    </summary>
    <div
      class="flex flex-col whitespace-pre-wrap
      max-w-full gap-1"
    >
      <div class="max-w-full mt-0.5 break-words text-sm">
        <Markdown source={node.comment_view.comment.content} />
      </div>
      {#if actions}
        <div class="flex flex-row gap-2 items-center">
          <CommentActions
            comment={node.comment_view}
            bind:replying
            on:edit={() => (editing = true)}
          />
        </div>
      {/if}
    </div>
    {#if replying}
      <div class="max-w-full my-2">
        <h1 class="font-bold text-sm mb-2">Reply</h1>
        <CommentForm
          {postId}
          parentId={node.comment_view.comment.id}
          on:comment={(e) => {
            node.children.push({
              children: [],
              comment_view: e.detail.comment_view,
              depth: node.depth + 1,
            })
            replying = false
          }}
        />
      </div>
    {/if}
    <div class="bg-transparent dark:bg-transparent">
      <slot />
    </div>
  </details>
</li>
