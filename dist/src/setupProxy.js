import { createProxyMiddleware } from "http-proxy-middleware";

export default function (app) {
    app.use('/info', createProxyMiddleware({
        target: "http://localhost:8000",
        changeOrigin: true,
    }))
}