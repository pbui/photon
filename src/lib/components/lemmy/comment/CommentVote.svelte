<script lang="ts">
  import { Color } from '$lib/ui/colors'
  import { ChevronDown, ChevronUp, Icon } from 'svelte-hero-icons'
  import { getClient } from '$lib/lemmy'
  import { userSettings } from '$lib/settings'
  import { profile } from '$lib/auth.js'

  export let vote: number = 0
  export let score: number
  export let commentId: number

  async function upvote() {
    if (!$profile?.jwt) return

    const upvoted = vote == 1

    if (vote == -1) {
      score += 2
    } else if (vote == 1) {
      score -= 1
    } else if (vote == 0) {
      score += 1
    }

    vote = Number(!upvoted)

    await getClient()
      .likeComment({
        score: upvoted ? 0 : 1,
        auth: $profile.jwt,
        comment_id: commentId,
      })
      .catch((_) => undefined)
  }

  async function downvote() {
    if (!$profile?.jwt) return

    const upvoted = vote == -1

    if (vote == -1) {
      score += 1
    } else if (vote == 1) {
      score -= 2
    } else if (vote == 0) {
      score -= 1
    }

    vote = -Number(!upvoted)

    await getClient()
      .likeComment({
        score: upvoted ? 0 : -1,
        auth: $profile.jwt,
        comment_id: commentId,
      })
      .catch((_) => undefined)
  }
</script>

<div
  class="flex flex-row items-center rounded-md transition-colors
  cursor-pointer h-full {Color.borderDark}"
>
  <button
    on:click={upvote}
    class="px-1.5 {vote == 1
      ? $userSettings.revertColors
        ? 'text-orange-500'
        : 'dark:text-blue-500 text-blue-600'
      : ''}"
    aria-label="Upvote"
  >
    <Icon src={ChevronUp} width={19} mini />
  </button>
  <span class="text-sm">
    {score}
  </span>
  <button
    on:click={downvote}
    class="px-1.5 {vote == -1
      ? $userSettings.revertColors
        ? 'dark:text-blue-500 text-blue-600'
        : 'text-red-400'
      : ''}"
    aria-label="Downvote"
  >
    <Icon src={ChevronDown} width={19} mini />
  </button>
</div>
