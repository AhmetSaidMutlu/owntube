import { useState } from 'react'
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { authClient } from '@/lib/auth-client'
import { IS_WEB } from '@/lib/config'
import { Alert, Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui'
import { makeStyles, radius, useTheme } from '@/lib/theme'

// Web'deki app/auth/login/page.tsx karşılığı (+ hesap oluşturma).
export default function LoginScreen() {
  const { colors } = useTheme()
  const s = useStyles()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [registering, setRegistering] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleGoogleLogin() {
    setLoading(true)
    setError('')
    // Tarayıcıda Google dönüşü sunucunun değil bu uygulamanın adresine yapılmalı.
    const callbackURL = IS_WEB ? window.location.origin : '/'
    const result = await authClient.signIn.social({ provider: 'google', callbackURL })
    if (result.error) setError('Unable to sign in with Google.')
    setLoading(false)
  }

  async function handleEmail() {
    setLoading(true)
    setError('')
    const result = registering
      ? await authClient.signUp.email({ email: email.trim(), password, name: name.trim() || email.split('@')[0] || 'User' })
      : await authClient.signIn.email({ email: email.trim(), password })
    if (result.error) setError(registering ? 'Unable to create account.' : 'Unable to sign in with these credentials.')
    setLoading(false)
  }

  return (
    <SafeAreaView style={s.screen}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.flex}>
        <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
          <Card>
            <CardHeader style={s.center}>
              <CardTitle style={s.title}>OwnTube</CardTitle>
              <CardDescription style={s.centerText}>Your private YouTube subscription feed</CardDescription>
            </CardHeader>
            <CardContent style={s.form}>
              <Button label="Continue with Google" variant="outline" onPress={handleGoogleLogin} disabled={loading} />
              <View style={s.divider}>
                <View style={s.line} /><Text style={s.or}>or</Text><View style={s.line} />
              </View>
              <Alert message={error} />
              {registering ? (
                <TextInput placeholder="Name" placeholderTextColor={colors.mutedForeground} style={s.input} value={name} onChangeText={setName} />
              ) : null}
              <TextInput placeholder="Email" placeholderTextColor={colors.mutedForeground} style={s.input} value={email} onChangeText={setEmail} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" autoComplete="email" />
              <TextInput placeholder="Password" placeholderTextColor={colors.mutedForeground} style={s.input} value={password} onChangeText={setPassword} secureTextEntry autoComplete="password" />
              <Button
                label={loading ? (registering ? 'Creating account...' : 'Signing in...') : registering ? 'Create account' : 'Sign in'}
                onPress={handleEmail}
                disabled={loading || !email || !password}
              />
              <Pressable onPress={() => setRegistering((value) => !value)} hitSlop={8}>
                <Text style={s.switch}>{registering ? 'Already have an account? Sign in' : 'New here? Create an account'}</Text>
              </Pressable>
            </CardContent>
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const useStyles = makeStyles((c) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: c.background },
  flex: { flex: 1 },
  content: { flexGrow: 1, justifyContent: 'center', padding: 16 },
  center: { alignItems: 'center' },
  centerText: { textAlign: 'center' },
  title: { fontSize: 30, fontWeight: '700' },
  form: { gap: 12 },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  line: { flex: 1, height: 1, backgroundColor: c.border },
  or: { color: c.mutedForeground, fontSize: 12 },
  input: { borderColor: c.input, borderWidth: 1, borderRadius: radius.md, backgroundColor: c.background, color: c.foreground, paddingHorizontal: 12, paddingVertical: 8, fontSize: 16 },
  switch: { color: c.mutedForeground, textAlign: 'center', fontSize: 13, paddingTop: 4 },
}))
