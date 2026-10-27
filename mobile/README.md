# OwnTube Mobile (Expo / React Native)

Next.js uygulamasıyla aynı backend'i kullanır: Better Auth oturumu, `/api/*` uçları, Neon veritabanı.
Ortak tipler ve akış kuralları (`smartSort`, `orderRelated`, `formatTimeAgo`) kök dizindeki `shared/` klasöründedir.

## Çalıştırma

1. Kök dizinde web sunucusunu başlat: `bun dev`
2. `mobile/.env` içindeki `EXPO_PUBLIC_API_URL` değerini telefonun erişebileceği adrese ayarla.
   - Android (USB/emülatör): `adb reverse tcp:3000 tcp:3000` → `http://localhost:3000` (Google girişi için önerilen yol)
   - Aynı Wi-Fi: `http://<bilgisayar-IP>:3000` (e-posta girişi çalışır; Google, özel IP'ye yönlendirmeye izin vermez)
3. `cd mobile && bun install && bun run start`, ardından Expo Go ile QR kodu okut veya `a` tuşuyla Android'de aç.

## Ekranlar

| Mobil | Web karşılığı |
|---|---|
| `app/login.tsx` | `app/auth/login` |
| `app/(tabs)/index.tsx` | `app/(protected)/dashboard` |
| `app/(tabs)/videos.tsx` | `app/(protected)/videos` |
| `app/(tabs)/subscriptions.tsx` | `app/(protected)/subscriptions` |
| `app/(tabs)/settings.tsx` | `app/(protected)/settings` |
| `app/watch/[id].tsx` | `app/(protected)/watch/[id]` |
| `app/channel/[id].tsx` | `app/channel/[id]` |
