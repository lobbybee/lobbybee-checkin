<script setup lang="ts">
import { computed } from 'vue'
import UploadTile from '~/components/UploadTile.vue'

const { guestCount, guestDocs } = useCheckin()

const sub = computed(() =>
  guestCount.value === 1
    ? 'Add one photo ID for your 1 companion.'
    : `Add one photo ID for each of your ${guestCount.value} companions.`
)
</script>

<template>
  <section>
    <h2 class="title guests-title">Accompanying guest IDs</h2>
    <p class="sub">{{ sub }}</p>

    <div
      v-for="(doc, i) in guestDocs"
      :key="i"
      class="guest-card"
    >
      <div class="gc-head">
        <div class="avatar">{{ i + 2 }}</div>
        <div>
          <strong>Guest {{ i + 2 }}</strong>
          <span>Companion ID document</span>
        </div>
      </div>
      <div class="card-label">ID document <span class="req">*</span></div>
      <UploadTile
        :state="doc"
        label="ID document"
        sub="Front side"
        :missing-msg="`Add an ID photo for Guest ${i + 2}.`"
        full
      />
    </div>
  </section>
</template>

<style scoped>
.guests-title {
  margin-top: 8px;
}

.guest-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 22px;
  padding: 18px 16px 20px;
  margin-bottom: 16px;
  box-shadow: var(--shadow);
}

.gc-head {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 6px;
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(160deg, var(--accent-soft), var(--accent));
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  color: var(--accent-ink);
  font-size: 16px;
  flex: 0 0 auto;
}

.gc-head strong {
  font-size: 16px;
  font-weight: 800;
}

.gc-head span {
  font-size: 12.5px;
  color: var(--muted);
  display: block;
}

.guest-card .card-label {
  margin-top: 14px;
}

.guest-card .card-label .req {
  color: var(--danger);
}
</style>
