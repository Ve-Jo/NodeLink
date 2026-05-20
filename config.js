import baseConfig from './config.default.js'

const config = structuredClone(baseConfig)

const toInt = (value, fallback) => {
  const parsed = Number.parseInt(String(value ?? ''), 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

// Low-RAM defaults for Railway/serverless-style workloads.
config.cluster.enabled = true
config.cluster.workers = toInt(process.env.CLUSTER_WORKERS, 1)
config.cluster.minWorkers = 1
config.cluster.runtime.workerMaxOldSpaceMb = toInt(
  process.env.NODELINK_WORKER_MAX_OLD_SPACE_MB,
  192
)
config.cluster.runtime.sourceWorkerMaxOldSpaceMb = toInt(
  process.env.NODELINK_SOURCE_WORKER_MAX_OLD_SPACE_MB,
  128
)
config.cluster.scaling.maxPlayersPerWorker = 8
config.cluster.scaling.checkIntervalMs = 10_000
config.cluster.scaling.idleWorkerTimeoutMs = 30_000

// Keep source operations inside the main worker pool to reduce extra processes.
config.cluster.specializedSourceWorker.enabled = false
config.cluster.specializedSourceWorker.count = 1
config.cluster.specializedSourceWorker.microWorkers = 1
config.cluster.specializedSourceWorker.tasksPerWorker = 8

// Reduce noisy logging overhead.
config.logging.level = 'warn'
config.logging.debug.all = false
config.logging.debug.request = false
config.logging.debug.session = false
config.logging.debug.player = false
config.logging.debug.filters = false
config.logging.debug.sources = false
config.logging.debug.lyrics = false
config.logging.debug.youtube = false
config.logging.debug['youtube-cipher'] = false

// Keep only commonly used lightweight sources by default.
const allowedSources = new Set(['youtube', 'soundcloud', 'http', 'local'])
for (const [sourceName, sourceConfig] of Object.entries(config.sources || {})) {
  if (
    sourceConfig &&
    typeof sourceConfig === 'object' &&
    Object.hasOwn(sourceConfig, 'enabled')
  ) {
    sourceConfig.enabled = allowedSources.has(sourceName)
  }
}

config.defaultSearchSource = ['youtube', 'soundcloud']
config.unifiedSearchSources = ['youtube', 'soundcloud']
config.maxSearchResults = 5
config.maxAlbumPlaylistLength = 50
config.enableHoloTracks = false
config.enableTrackStreamEndpoint = false
config.enableLoadStreamEndpoint = false
config.resolveExternalLinks = false
config.fetchChannelInfo = false

// Bun websocket server is experimental; enable explicitly.
config.server.useBunServer =
  String(process.env.NODELINK_SERVER_USEBUNSERVER || '').toLowerCase() ===
  'true'

export default config
