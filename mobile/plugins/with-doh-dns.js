// Bazı operatörler *.vercel.app gibi alan adlarını DNS düzeyinde engelliyor: tarayıcı kendi
// şifreli DNS'iyle (DoH) siteyi açabilirken uygulama operatörün DNS'iyle yanıtsız bir adrese
// bağlanıp takılıyor. Bu eklenti React Native'in OkHttp istemcisine DoH çözümleyici ekler.
const fs = require('fs')
const path = require('path')
const { withAppBuildGradle, withDangerousMod, withMainApplication } = require('expo/config-plugins')

const DEPENDENCY = 'implementation("com.squareup.okhttp3:okhttp-dnsoverhttps:4.12.0")'

const factorySource = (pkg) => `package ${pkg}

import com.facebook.react.modules.network.OkHttpClientFactory
import com.facebook.react.modules.network.OkHttpClientProvider
import java.net.InetAddress
import java.net.UnknownHostException
import java.util.concurrent.TimeUnit
import okhttp3.Dns
import okhttp3.HttpUrl.Companion.toHttpUrl
import okhttp3.OkHttpClient
import okhttp3.dnsoverhttps.DnsOverHttps

/** Ad çözümleme sırası: Cloudflare DoH → Google DoH → sistem DNS'i. (plugins/with-doh-dns.js ile üretilir) */
class DohOkHttpClientFactory : OkHttpClientFactory {
  override fun createNewNetworkModuleClient(): OkHttpClient =
    OkHttpClientProvider.createClientBuilder()
      .dns(dns)
      // Engellenmiş bir IP'de sonsuza dek beklemek yerine sıradaki adres denenir.
      .connectTimeout(15, TimeUnit.SECONDS)
      .build()

  companion object {
    private val bootstrap = OkHttpClient.Builder()
      .connectTimeout(5, TimeUnit.SECONDS)
      .readTimeout(5, TimeUnit.SECONDS)
      .build()

    private fun doh(url: String, vararg ips: String): Dns = DnsOverHttps.Builder()
      .client(bootstrap)
      .url(url.toHttpUrl())
      .bootstrapDnsHosts(ips.map { InetAddress.getByName(it) })
      .build()

    private val resolvers: List<Dns> by lazy {
      listOf(
        doh("https://cloudflare-dns.com/dns-query", "1.1.1.1", "1.0.0.1"),
        doh("https://dns.google/dns-query", "8.8.8.8", "8.8.4.4"),
        Dns.SYSTEM,
      )
    }

    private val dns = object : Dns {
      override fun lookup(hostname: String): List<InetAddress> {
        var lastError: UnknownHostException? = null
        for (resolver in resolvers) {
          try {
            val addresses = resolver.lookup(hostname)
            if (addresses.isNotEmpty()) return addresses
          } catch (error: UnknownHostException) {
            lastError = error
          }
        }
        throw lastError ?: UnknownHostException(hostname)
      }
    }
  }
}
`

module.exports = function withDohDns(config) {
  const pkg = config.android?.package
  if (!pkg) throw new Error('with-doh-dns: android.package is required')

  config = withAppBuildGradle(config, (mod) => {
    if (!mod.modResults.contents.includes('okhttp-dnsoverhttps')) {
      mod.modResults.contents = mod.modResults.contents.replace(/dependencies\s*\{/, (match) => `${match}\n    ${DEPENDENCY}`)
    }
    return mod
  })

  config = withMainApplication(config, (mod) => {
    let src = mod.modResults.contents
    if (!src.includes('DohOkHttpClientFactory')) {
      src = src.replace(/\nimport /, '\nimport com.facebook.react.modules.network.OkHttpClientProvider\nimport ')
      src = src.replace(/(\n\s*)loadReactNative\(this\)/, '$1OkHttpClientProvider.setOkHttpClientFactory(DohOkHttpClientFactory())$1loadReactNative(this)')
      if (!src.includes('setOkHttpClientFactory')) throw new Error('with-doh-dns: MainApplication onCreate not found')
    }
    mod.modResults.contents = src
    return mod
  })

  return withDangerousMod(config, ['android', (mod) => {
    const dir = path.join(mod.modRequest.platformProjectRoot, 'app/src/main/java', ...pkg.split('.'))
    fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(path.join(dir, 'DohOkHttpClientFactory.kt'), factorySource(pkg))
    return mod
  }])
}
