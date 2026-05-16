<template>
  <div class="flex flex-col border border-amber-500 rounded-xl p-4 bg-white gap-5">
    <div class="flex border border-brand-peach rounded-2xl p-3 bg-brand-peach gap-2">
      <div class="flex items-center gap-1">
        <label for="" class="text-xs text-amber-900 font-semibold">FROM</label>
        <input type="month" v-model="bulanIn" @change="applyFilter" class="text-xs border border-brand-peach rounded-xl p-1 bg-white outline-none focus:border-amber-900">
      </div>
      <div class="h-0.5 w-2 my-auto bg-amber-900" />
      <div class="flex items-center gap-1">
        <label for="" class="text-xs text-amber-900 font-semibold ">TO</label>
        <input type="month" v-model="bulanOut" @change="applyFilter" class="text-xs border border-brand-peach rounded-xl p-1 bg-white outline-none focus:border-amber-900">
      </div>
      <div class="w-0.5 h-6 bg-pink-200" />
      <div class="flex items-center gap-1">
        <label class="text-xs text-amber-900 font-semibold">Filter</label>
        <select
            class="text-xs border border-brand-peach rounded-xl p-1 bg-white outline-none focus:border-amber-900"
            v-model="currentFilter"
            @change="filterChange"
        >
          <option value="none">None</option>
          <option value="departemen">Departemen</option>
          <option value="kategori">Kategori</option>
        </select>
      </div>

      <!-- Select kedua, hanya muncul kalau filter dipilih -->
      <div v-if="currentFilter === 'departemen'" class="flex items-center gap-1">
        <label class="text-xs text-amber-900 font-semibold">Pilih Departemen</label>
        <select class="text-xs border border-brand-peach rounded-xl p-1 bg-white outline-none focus:border-amber-900"
                v-model="selectedDepartemen"
                @change="applyFilter"
        >
          <option value="">-- Pilih --</option>
          <option v-for="dept in departments" :key="dept" :value="dept">
            {{ dept }}
          </option>
        </select>
      </div>

      <div v-if="currentFilter === 'kategori'" class="flex items-center gap-1">
        <label class="text-xs text-amber-900 font-semibold">Pilih Kategori</label>
        <select class="text-xs border border-brand-peach rounded-xl p-1 bg-white outline-none focus:border-amber-900"
                v-model="selectedKategori"
                @change="applyFilter"
        >
          <option value="">-- Pilih --</option>
          <option value="Amenities">Amenities</option>
          <option value="Konsumsi">Konsumsi</option>
          <option value="Peralatan">Peralatan</option>
          <option value="Lain-lain">Lain-lain</option>
        </select>
      </div>
    </div>
    <div class="flex flex-col" ref="svgWrapperRef">
      <svg
          :viewBox="`0 0 ${SVG_W} ${SVG_H}`"
          width="100%"
          height="100%"
          xmlns="http://www.w3.org/2000/svg"
          @mouseleave="onChartLeave"
      >
        <g v-for="tick in yTicks" :key="tick">
          <line
              :x1="PAD_L" :y1="yPos(tick)"
              :x2="SVG_W - PAD_R" :y2="yPos(tick)"
              class="stroke-1"
              :class="yTicks[0] === tick? 'stroke-amber-900' : '[stroke-dasharray:3_4] stroke-brand-peach'"
          />
          <text
              :x="PAD_L - 5" :y="yPos(tick) + 4"
              class="[font-size:5px] fill-amber-900"
              text-anchor="end"
          >{{ tick }}</text>
        </g>
        <g v-for="(cat, ci) in series" :key="cat.category">
          <rect
              v-for="(sub, si) in subcategories"
              :key="sub.key"
              :x="hoveredSub === sub.key && hoveredCat === cat.category ? barX(ci) - (barWidth * 0.05) : barX(ci)"
              :y="segY(cat, si) - 0.5"
              :width="hoveredSub === sub.key && hoveredCat === cat.category ? barWidth * 1.1 : barWidth"
              :height="segH(cat, si)"
              :fill="sub.color"
              :class="[
                'transition-all duration-200',
                (hoveredSub && hoveredSub !== sub.key) || (hoveredCat && hoveredCat !== cat.category) ? 'opacity-50' : ''
              ]"
              :style="{ animationDelay: `${ci * 0.055 + si * 0.025}s` }"
              @mouseenter="onSegmentEnter($event, cat, sub)"
              @mouseleave="onSegmentLeave"
          ></rect>
          <text
              :x="barX(ci) + barWidth / 2"
              :y="SVG_H - PAD_B + 10"
              class="[font-size:5px] fill-amber-900 font-medium"
              text-anchor="middle"
          >{{ cat.category }}</text>
        </g>
        <line
            :x1="PAD_L" :y1="PAD_T"
            :x2="PAD_L" :y2="SVG_H - PAD_B"
            class="stroke-amber-900 stroke-1"
        />
      </svg>

      <Transition name="tooltip-fade">
        <div
            v-if="tooltip.visible"
            class="absolute pointer-events-none bg-gray-800 border border-black rounded-xl flex flex-col gap-1 p-2"
            :style="{ left: tooltip.x + 'px', top: tooltip.y + 'px' }"
        >
          <span class="text-xs text-white">{{ tooltip.category }}</span>
          <div class="flex text-white items-center gap-1">
            <span class="flex-shrink-0 rounded h-3 w-3" :style="{ background: tooltip.color }"></span>
            <span class="text-xs text-white font-medium">{{ tooltip.label }}</span>
            <span class="text-xl text-white">·</span>
            <strong class="text-xs text-white font-medium">{{ tooltip.value }}</strong>
          </div>
          <span class="text-xs text-white">{{ tooltip.pct }}% dari total kolom</span>
        </div>
      </Transition>
    </div>
    <div class="flex border border-brand-peach rounded-2xl p-3 bg-brand-peach">
      <div v-for="(sub) in subcategories" :key="sub.key" class="flex gap-2 items-center p-3">
        <span class="flex rounded h-3 w-3" :style="{ background: sub.color }"></span>
        <span class="flex text-amber-900">{{ sub.label }}</span>
      </div>
    </div>
  </div>
</template>

<script>
import {computed, onMounted, reactive, ref, nextTick} from "vue";

export default {
  name: 'StackedBarChart2',

  props: {
    subcategories: {
      type: Array,
      default: () => [
        { key: 'produk_a', label: 'Produk A', color: '#f97316' },
        { key: 'produk_b', label: 'Produk B', color: '#3b82f6' },
        { key: 'produk_c', label: 'Produk C', color: '#a855f7' },
        { key: 'produk_d', label: 'Produk D', color: '#10b981' },
      ],
    },
    series: {
      type: Array,
      default: () => [
        { category: 'Jan', produk_a: 120, produk_b: 85,  produk_c: 60,  produk_d: 40  },
        { category: 'Feb', produk_a: 95,  produk_b: 110, produk_c: 75,  produk_d: 55  },
        { category: 'Mar', produk_a: 140, produk_b: 70,  produk_c: 90,  produk_d: 30  },
        { category: 'Apr', produk_a: 80,  produk_b: 130, produk_c: 50,  produk_d: 70  },
        { category: 'Mei', produk_a: 160, produk_b: 95,  produk_c: 110, produk_d: 45  },
        { category: 'Jun', produk_a: 105, produk_b: 115, produk_c: 80,  produk_d: 90  },
      ],
    },
    isLoading: {
      type: Boolean,
      default: false
    },
    isError: {
      type: Boolean,
      default: false
    },
    departments: {
      type: Array,
      default: () => []
    },
  },

  emits: ['filter-change'],

  setup(props, { emit }) {
    const chartPanelRef = ref(null)
    const svgWrapperRef = ref(null)
    const chartPanelHeight = ref(0)
    const bulanIn = ref('')
    const bulanOut = ref('')
    const currentFilter = ref('none')
    const selectedDepartemen = ref('')
    const selectedKategori = ref('')

    onMounted(async () => {
      const today = new Date()
      const year = today.getFullYear()
      const month = String(today.getMonth() + 1).padStart(2, '0')

      // 3. Set nilai ke ref
      bulanIn.value = `${year}-${month}`
      bulanOut.value = `${year}-${month}`

      await nextTick()
      if (chartPanelRef.value) {
        chartPanelHeight.value = chartPanelRef.value.offsetHeight
      }
    })

    const SVG_W = 500
    const SVG_H = 200
    const PAD_L = 20
    const PAD_R = 20
    const PAD_T = 5
    const PAD_B = 15

    const chartW  = SVG_W - PAD_L - PAD_R
    const barGap  = 26

    const barWidth = computed(() =>
        (chartW / props.series.length) - barGap
    )

    const barX = (ci) =>
        PAD_L + ci * (chartW / props.series.length) + barGap / 2

    const catTotal = (cat) =>
        props.subcategories.reduce((s, sub) => s + (cat[sub.key] || 0), 0)

    const maxTotal = computed(() =>
        Math.max(...props.series.map(catTotal))
    )

    const yMax = computed(() =>
        Math.ceil(maxTotal.value / 50) * 50 || 100
    )

    const yPos = (v) =>
        PAD_T + (SVG_H - PAD_T - PAD_B) * (1 - v / yMax.value)

    const yTicks = computed(() =>
        Array.from({ length: 6 }, (_, i) =>
            Math.round((i / 5) * yMax.value)
        )
    )
    const segStartVal = (cat, si) =>
        props.subcategories
            .slice(0, si)
            .reduce((s, sub) => s + (cat[sub.key] || 0), 0)

    const segY = (cat, si) =>
        yPos(segStartVal(cat, si) + (cat[props.subcategories[si].key] || 0))

    const segH = (cat, si) =>
        yPos(segStartVal(cat, si)) - segY(cat, si)

    // ── Agregasi legend ─────────────────────────────────────
    const subTotal = (key) =>
        props.series.reduce((s, c) => s + (c[key] || 0), 0)

    const grandTotal = computed(() =>
        props.subcategories.reduce((s, sub) => s + subTotal(sub.key), 0)
    )

    const subPct = (key) =>
        grandTotal.value
            ? Math.round((subTotal(key) / grandTotal.value) * 100)
            : 0

    // ── Interaksi ────────────────────────────────────────────
    const hoveredSub = ref(null)
    const hoveredCat = ref(null)

    const tooltip = reactive({
      visible: false, x: 0, y: 0,
      category: '', label: '', value: 0, color: '', pct: 0,
    })

    const onSegmentEnter = (event, cat, sub) => {
      hoveredCat.value = cat.category
      hoveredSub.value = sub.key
      const val   = cat[sub.key] || 0
      const total = catTotal(cat)
      Object.assign(tooltip, {
        visible : true,
        category: cat.category,
        label   : sub.label,
        value   : val,
        color   : sub.color,
        pct     : total ? Math.round((val / total) * 100) : 0,
      })
      // Posisi relatif ke svg-wrapper
      if (svgWrapperRef.value) {
        const rect = svgWrapperRef.value.getBoundingClientRect()
        tooltip.x = event.clientX - rect.left + 270
        tooltip.y = event.clientY - rect.top + 80
      }
    }

    const onSegmentLeave = () => {
      hoveredSub.value = null
      hoveredCat.value = null
      tooltip.visible  = false
    }

    const onChartLeave = () => {
      hoveredSub.value = null
      hoveredCat.value = null
      tooltip.visible  = false
    }

    const filterChange = () => {
      selectedDepartemen.value = ''
      selectedKategori.value = ''

      applyFilter()
    }

    const applyFilter = () => {
      let filterValue = 'none'

      if (currentFilter.value === 'departemen' && selectedDepartemen.value) {
        filterValue = selectedDepartemen.value
      } else if (currentFilter.value === 'kategori' && selectedKategori.value) {
        filterValue = selectedKategori.value
      }

      emit('filter-change', {
        bulanIn: bulanIn.value,
        bulanOut: bulanOut.value,
        filter: currentFilter.value,
        filterValue: filterValue
      })
    }

    return {
      // refs
      chartPanelRef, svgWrapperRef, chartPanelHeight, bulanIn, bulanOut,
      currentFilter, selectedDepartemen, selectedKategori,
      // geometri
      SVG_W, SVG_H, PAD_L, PAD_R, PAD_T, PAD_B,
      barWidth, barX,
      yPos, yTicks, segY, segH,
      // data
      catTotal, subTotal, grandTotal, subPct,
      // interaksi
      hoveredSub, hoveredCat, tooltip,
      onSegmentEnter, onSegmentLeave, onChartLeave, filterChange, applyFilter,
    }
  }
}
</script>