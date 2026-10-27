import { useState } from 'react'
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { authClient } from '@/lib/auth-client'
import { IS_WEB } from '@/lib/config'
import { Banner, Button } from '@/components/ui'
import { radii, theme } from '@/lib/theme'

// Web'deki app/auth/login/page.tsx karşılığı (+ hesap oluşturma).
export default function LoginScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [registering, setRegistering] = useState(false)
  const [loading, setLoading] = useState<'google' | 'email' | null>(null)
  const [error, setError] = useState('')

  async function handleGoogleLogin() {
    setLoading('google')
    setError('')
    // Tarayıcıda Google dönüşü sunucunun değil bu uygulamanın adresine yapılmalı.
    const callbackURL = IS_WEB ? window.location.origin : '/'
    const result = await authClient.signIn.social({ provider: 'google', callbackURL })
    if (result.error) setError('Unable to sign in with Google.')
    setLoading(null)
  }

  async function handleEmail() {
    setLoading('email')
    setError('')
    const result = registering
      ? await authClient.signUp.email({ email: email.trim(), password, name: name.trim() || email.split('@')[0] || 'User' })
      : await authClient.signIn.email({ email: email.trim(), password })
    if (result.error) setError(registering ? 'Unable to create account.' : 'Unable to sign in with these credentials.')
    setLoading(null)
  }

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.content}>
        <Text style={styles.title}>OwnTube</Text>
        <Text style={styles.subtitle}>Your private YouTube subscription feed</Text>

        <View style={styles.form}>
          <Button label="Continue with Google" icon="logo-google" variant="secondary" onPress={handleGoogleLogin} loading={loading === 'google'} disabled={loading !== null} />
          <View style={styles.divider}>
            <View style={styles.line} /><Text style={styles.or}>or</Text><View style={styles.line} />
          </View>
          <Banner message={error} />
          {registering ? <TextInput placeholder="Name" placeholderTextColor={theme.subtle} style={styles.input} value={name} onChangeText={setName} /> : null}
          <TextInput placeholder="Email" placeholderTextColor={theme.subtle} style={styles.input} value={email} onChangeText={setEmail} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" autoComplete="email" />
          <TextInput placeholder="Password" placeholderTextColor={theme.subtle} style={styles.input} value={password} onChangeText={setPassword} secureTextEntry autoComplete="password" />
          <Button
            label={registering ? 'Create account' : 'Sign in'}
            onPress={handleEmail}
            loading={loading === 'email'}
            disabled={loading !== null || !email || !password}
          />
          <Pressable onPress={() => setRegistering((value) => !value)} hitSlop={8}>
            <Text style={styles.switch}>{registering ? 'Already have an account? Sign in' : 'New here? Create an account'}</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.bg },
  content: { flex: 1, justifyContent: 'center', padding: 24 },
  title: { color: theme.text, fontSize: 34, fontWeight: '800', textAlign: 'center' },
  subtitle: { color: theme.muted, fontSize: 15, textAlign: 'center', marginTop: 8 },
  form: { gap: 12, marginTop: 36 },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 4 },
  line: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: theme.border },
  or: { color: theme.subtle, fontSize: 12 },
  input: { backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 1, borderRadius: radii.control, color: theme.text, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15 },
  switch: { color: theme.muted, textAlign: 'center', padding: 8, fontSize: 14 },
})
