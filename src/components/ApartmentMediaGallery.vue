<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useToast } from '@/composables/useToast'
import type { ApartmentMediaItemDto } from '@/types/apartment'

const props = withDefaults(
  defineProps<{
    show: boolean
    items: ApartmentMediaItemDto[]
    loading?: boolean
    headline?: string
    initialIndex?: number
  }>(),
  { loading: false, headline: '', initialIndex: 0 },
)

const emit = defineEmits<{ close: [] }>()
const toast = useToast()

const index = ref(0)
const thumbStripRef = ref<HTMLElement | null>(null)

watch(
  () => [props.show, props.initialIndex, props.items] as const,
  () => {
    if (!props.show || !props.items.length) return
    const max = props.items.length - 1
    index.value = Math.min(Math.max(props.initialIndex ?? 0, 0), max)
    void nextTick(() => scrollActiveThumb())
  },
)

watch(index, () => void nextTick(() => scrollActiveThumb()))

function scrollActiveThumb() {
  const strip = thumbStripRef.value
  if (!strip) return
  const el = strip.querySelector(`[data-thumb-idx="${index.value}"]`)
  el?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
}

function close() {
  emit('close')
}

function goPrev() {
  if (!props.items.length) return
  index.value = (index.value - 1 + props.items.length) % props.items.length
}

function goNext() {
  if (!props.items.length) return
  index.value = (index.value + 1) % props.items.length
}

function mediaTypeUpper(item: ApartmentMediaItemDto | undefined) {
  return String(item?.type ?? '').toUpperCase()
}

function isVideo(item: ApartmentMediaItemDto | undefined) {
  if (!item) return false
  const t = mediaTypeUpper(item)
  if (t === 'VIDEO' || t.includes('VIDEO')) return true
  return /\.(mp4|webm|ogg)(\?.*)?$/i.test(item.url)
}

function isLikelyImage(item: ApartmentMediaItemDto | undefined) {
  if (!item || isVideo(item)) return false
  const t = mediaTypeUpper(item)
  if (t === 'IMAGE' || t.includes('IMAGE')) return true
  if (t.includes('FILE')) return false
  return /\.(jpe?g|png|gif|webp|bmp|svg)(\?.*)?$/i.test(item.url)
}

function thumbSrc(item: ApartmentMediaItemDto) {
  if (item.thumbnailUrl) return item.thumbnailUrl
  if (isLikelyImage(item)) return item.url
  if (!isVideo(item) && !mediaTypeUpper(item).includes('FILE')) return item.url
  return ''
}

function thumbKey(item: ApartmentMediaItemDto, i: number) {
  return item.id ?? `${item.url}-${i}`
}

const current = computed(() => props.items[index.value])
const count = computed(() => props.items.length)
const counterLabel = computed(() => (count.value ? `${index.value + 1} / ${count.value}` : '0 / 0'))

function onKeydown(e: KeyboardEvent) {
  if (!props.show) return
  if (e.key === 'Escape') {
    e.preventDefault()
    close()
  } else if (e.key === 'ArrowLeft') {
    e.preventDefault()
    goPrev()
  } else if (e.key === 'ArrowRight') {
    e.preventDefault()
    goNext()
  }
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => window.removeEventListener('keydown', onKeydown))

async function shareCurrent() {
  const url = current.value?.url
  if (!url) return
  try {
    if (navigator.share) {
      await navigator.share({ title: props.headline || 'Media căn hộ', url })
    } else {
      await navigator.clipboard.writeText(url)
      toast.success('Đã copy liên kết.')
    }
  } catch {
    try {
      await navigator.clipboard.writeText(url)
      toast.success('Đã copy liên kết.')
    } catch {
      toast.error('Không copy được liên kết.')
    }
  }
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="show"
      class="fixed inset-0 z-[110] flex flex-col bg-[rgba(7,30,39,0.98)] backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="media-gallery-title"
    >
      <!-- Top bar -->
      <div class="flex h-20 w-full shrink-0 items-center justify-between px-4 sm:px-6">
        <div class="flex min-w-0 items-center gap-3 md:gap-4">
          <div class="rounded-full border border-white/10 bg-white/10 px-3 py-1.5 backdrop-blur-md sm:px-4">
            <span class="font-headline text-sm font-bold tracking-widest text-white">{{ counterLabel }}</span>
          </div>
          <h2
            id="media-gallery-title"
            class="hidden min-w-0 truncate font-headline text-sm font-bold uppercase tracking-wider text-white/80 md:block"
          >
            {{ headline || 'Ảnh & video căn hộ' }}
          </h2>
        </div>
        <div class="flex shrink-0 items-center gap-2 sm:gap-3">
          <button
            type="button"
            class="flex h-11 w-11 items-center justify-center rounded-full bg-white/5 text-white transition-all hover:bg-white/10 active:scale-95 sm:h-12 sm:w-12"
            aria-label="Chia sẻ hoặc copy liên kết"
            @click="shareCurrent"
          >
            <span class="material-symbols-outlined text-[22px]">share</span>
          </button>
          <div class="mx-1 hidden h-6 w-px bg-white/10 sm:block" aria-hidden="true" />
          <button
            type="button"
            class="flex h-11 w-11 items-center justify-center rounded-full bg-white text-on-surface shadow-xl transition-all hover:bg-surface-container-highest active:scale-95 sm:h-12 sm:w-12"
            aria-label="Đóng"
            @click="close"
          >
            <span class="material-symbols-outlined font-bold">close</span>
          </button>
        </div>
      </div>

      <!-- Main stage -->
      <div class="group relative flex min-h-0 flex-1 items-center justify-center px-4 md:px-12">
        <div v-if="loading && !items.length" class="py-16 text-center text-white/70">Đang tải media…</div>
        <template v-else-if="!items.length">
          <p class="px-4 text-center text-white/80">Chưa có ảnh hoặc video cho căn này.</p>
        </template>
        <template v-else>
          <div class="absolute left-2 z-10 md:left-8">
            <button
              type="button"
              class="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-black/20 text-white opacity-100 backdrop-blur-xl transition-all hover:bg-black/40 active:scale-90 md:h-16 md:w-16 md:opacity-0 md:group-hover:opacity-100"
              aria-label="Ảnh trước"
              @click="goPrev"
            >
              <span class="material-symbols-outlined text-2xl md:text-3xl">chevron_left</span>
            </button>
          </div>

          <div class="relative flex h-full w-full max-w-6xl items-center justify-center">
            <video
              v-if="current && isVideo(current)"
              :key="'v-' + current.url"
              class="max-h-[min(70dvh,663px)] w-full rounded-lg bg-black object-contain shadow-[0_32px_64px_rgba(0,0,0,0.5)]"
              controls
              playsinline
              :poster="current.thumbnailUrl ?? undefined"
              :src="current.url"
            />
            <img
              v-else-if="current && isLikelyImage(current)"
              :key="'i-' + current.url"
              class="max-h-[min(70dvh,663px)] w-auto max-w-full rounded-lg object-contain shadow-[0_32px_64px_rgba(0,0,0,0.5)]"
              :alt="current.title || 'Ảnh căn hộ'"
              :src="current.url"
            />
            <a
              v-else-if="current"
              :key="'f-' + current.url"
              class="flex max-h-[min(70dvh,663px)] min-h-[200px] max-w-lg flex-col items-center justify-center gap-4 rounded-lg border border-white/15 bg-white/5 p-10 text-center text-white shadow-lg transition-colors hover:bg-white/10"
              :href="current.url"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span class="material-symbols-outlined text-5xl text-white/90">description</span>
              <span class="text-sm font-semibold">Mở tệp trong tab mới</span>
              <span v-if="current.title" class="max-w-full truncate text-xs text-white/70">{{ current.title }}</span>
            </a>
            <div
              v-if="current?.title"
              class="absolute bottom-4 left-1/2 max-w-[90%] -translate-x-1/2 rounded-full border border-white/10 bg-black/40 px-4 py-2 text-center text-sm font-medium text-white/90 backdrop-blur-lg md:bottom-6"
            >
              {{ current.title }}
            </div>
          </div>

          <div class="absolute right-2 z-10 md:right-8">
            <button
              type="button"
              class="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-black/20 text-white opacity-100 backdrop-blur-xl transition-all hover:bg-black/40 active:scale-90 md:h-16 md:w-16 md:opacity-0 md:group-hover:opacity-100"
              aria-label="Ảnh sau"
              @click="goNext"
            >
              <span class="material-symbols-outlined text-2xl md:text-3xl">chevron_right</span>
            </button>
          </div>
        </template>
      </div>

      <!-- Thumbnails -->
      <div
        v-if="items.length"
        class="w-full shrink-0 overflow-x-auto border-t border-white/5 bg-black/30 px-4 py-4 backdrop-blur-xl md:py-6"
      >
        <div ref="thumbStripRef" class="mx-auto flex max-w-7xl items-center justify-center gap-3 md:gap-4">
          <button
            v-for="(item, i) in items"
            :key="thumbKey(item, i)"
            type="button"
            :data-thumb-idx="i"
            class="relative shrink-0 overflow-hidden rounded-xl border-2 transition-all focus:outline-none focus:ring-2 focus:ring-primary/80"
            :class="
              i === index
                ? 'border-primary opacity-100 ring-2 ring-primary ring-offset-2 ring-offset-[rgba(7,30,39,0.98)]'
                : 'border-transparent opacity-50 hover:opacity-100'
            "
            :aria-label="'Xem mục ' + (i + 1)"
            @click="index = i"
          >
            <div class="relative h-16 w-16 md:h-24 md:w-24">
              <img
                v-if="thumbSrc(item)"
                class="h-full w-full object-cover"
                :alt="item.title || ''"
                :src="thumbSrc(item)"
              />
              <div
                v-else-if="isVideo(item)"
                class="flex h-full w-full items-center justify-center bg-primary-container/40"
              >
                <span class="material-symbols-outlined text-3xl text-white/90">smart_display</span>
              </div>
              <div
                v-else
                class="flex h-full w-full items-center justify-center bg-primary-container/30"
              >
                <span class="material-symbols-outlined text-2xl text-white/90">description</span>
              </div>
              <div
                v-if="isVideo(item)"
                class="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/30"
              >
                <span class="material-symbols-outlined text-2xl text-white drop-shadow-md">play_circle</span>
              </div>
            </div>
          </button>
        </div>
      </div>

      <p class="sr-only">Nhấn Escape để đóng. Phím mũi tên trái phải để xem ảnh hoặc video trước / sau.</p>
    </div>
  </Teleport>
</template>
