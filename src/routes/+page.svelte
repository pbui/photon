<script lang="ts">
  import { goto } from '$app/navigation'
  import { page } from '$app/stores'
  import Button from '$lib/components/input/Button.svelte'
  import StickyCard from '$lib/components/ui/StickyCard.svelte'
  import MultiSelect from '$lib/components/input/MultiSelect.svelte'
  import Post from '$lib/components/lemmy/post/Post.svelte'
  import SiteCard from '$lib/components/lemmy/SiteCard.svelte'
  import { fly } from 'svelte/transition'
  import Spinner from '$lib/components/ui/loader/Spinner.svelte'
  import { ArchiveBox, Icon, Plus } from 'svelte-hero-icons'
  import Pageination from '$lib/components/ui/Pageination.svelte'
  import Modal from '$lib/components/ui/modal/Modal.svelte'
  import { profile } from '$lib/auth.js'
  import Sort from '$lib/components/lemmy/Sort.svelte'
  import { searchParam } from '$lib/util.js'
  import { userSettings } from '$lib/settings.js'
  import PostFeed from '$lib/components/lemmy/post/PostFeed.svelte'
  import Placeholder from '$lib/components/ui/Placeholder.svelte'

  export let data

  let sidebar = false
</script>

<svelte:head>
  <title>Photon</title>
</svelte:head>

<Modal bind:open={sidebar}>
  <span slot="title">About</span>
  <div class="mx-auto">
    {#await data.streamed.site then site}
      <SiteCard site={site.site_view} taglines={site.taglines} />
    {/await}
  </div>
</Modal>

<div class="flex flex-row gap-4 w-full">
  <div class="flex flex-col gap-4 max-w-full w-full min-w-0">
    <header>
      <h1 class="text-3xl font-bold">Frontpage</h1>
    </header>
    <div class="xl:hidden">
      <Button on:click={() => (sidebar = !sidebar)}>About</Button>
    </div>
    <div
      class="flex flex-row gap-4 max-w-full w-full justify-between flex-wrap"
    >
      <MultiSelect
        options={['Subscribed', 'Local', 'All']}
        disabled={[$profile?.jwt == undefined]}
        selected={data.listingType}
        on:select={(e) => searchParam($page.url, 'type', e.detail, 'page')}
      />
      <Sort selected={data.sort} />
    </div>
    <section class="flex flex-col gap-4">
      {#if data.posts.posts.length == 0}
        <Placeholder>
          <Icon src={ArchiveBox} size="32" solid slot="icon" />
          <span slot="title">No posts</span>
          <Button href="/communities" class="mt-4" slot="action">
            <Icon src={Plus} size="16" mini slot="icon" />
            <span>Follow some communities</span>
          </Button>
        </Placeholder>
      {/if}
      <PostFeed posts={data.posts.posts} />
    </section>
    <Pageination
      page={data.page}
      on:change={(p) => searchParam($page.url, 'page', p.detail.toString())}
    />
  </div>
  <aside class="hidden xl:block">
    {#await data.streamed.site}
      <StickyCard>
        <div class="h-64 grid place-items-center">
          <Spinner width={32} />
        </div>
      </StickyCard>
    {:then site}
      <SiteCard site={site.site_view} taglines={site.taglines} />
    {:catch}
      <StickyCard>
        <h1 class="font-bold text-lg">Failed to load</h1>
      </StickyCard>
    {/await}
  </aside>
</div>
