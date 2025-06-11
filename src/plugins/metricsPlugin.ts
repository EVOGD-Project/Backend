import { Elysia } from 'elysia';
import { Gauge, Histogram, collectDefaultMetrics } from 'prom-client';

collectDefaultMetrics();

const runtimeInfo = new Gauge({
	name: 'runtime_info',
	help: 'Runtime Info',
	labelNames: ['commit', 'runtime']
});

runtimeInfo
	.labels(
		process.env['GIT_COMMIT'] || 'unknown',
		process?.versions?.['bun']
			? `Bun v${process?.versions?.['bun']}`
			: process?.versions?.['node']
				? `Node v${process?.versions?.['node']}`
				: 'unknown'
	)
	.set(1);

const httpRequestDuration = new Histogram({
	name: 'http_request_duration_seconds',
	help: 'HTTP Request Duration in seconds',
	labelNames: ['method', 'route', 'status_code'],
	buckets: [0.005, 0.01, 0.05, 0.1, 0.5, 1, 2, 5]
});

export const metricsPlugin = new Elysia()
	.state({
		startMs: performance.now()
	})
	.onBeforeHandle({ as: 'global' }, ({ store }) => {
		const start = performance.now();
		store.startMs = start;
	})
	.onAfterResponse({ as: 'global' }, ({ request, route, store, set }) => {
		const duration = (performance.now() - store.startMs) / 1000;

		httpRequestDuration.labels(request.method, route, set.status?.toString() ?? '200').observe(duration);
	});
