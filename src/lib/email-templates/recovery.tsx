import * as React from 'react'

import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
} from '@react-email/components'

interface RecoveryEmailProps {
  siteName: string
  token: string
}

// Code-only on purpose: campus email scanners open links and burn one-time
// reset links before the student can. A typed code can't be consumed that way.
export const RecoveryEmail = ({ siteName, token }: RecoveryEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your {siteName} reset code: {token}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={brand}>loom<span style={dot}>.</span></Text>
        <Heading style={h1}>Your password reset code</Heading>
        <Text style={text}>
          Enter this code in Loom to choose a new password.
        </Text>
        <Text style={codeStyle}>{token}</Text>
        <Text style={footer}>
          This code expires in 15 minutes. Never share it with anyone, Loom will never ask for it. If you didn't ask to reset your password, you
          can ignore this email. Your password won't change.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default RecoveryEmail

const main = { backgroundColor: '#ffffff', fontFamily: 'Inter, Arial, sans-serif', padding: '24px 0' }
const container = { backgroundColor: '#050505', borderRadius: '16px', padding: '32px 28px', maxWidth: '480px', margin: '0 auto', border: '1px solid #FF2BD6' }
const brand = { fontSize: '28px', fontWeight: 900 as const, color: '#ffffff', margin: '0 0 24px' }
const dot = { color: '#FACC15' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#ffffff', margin: '0 0 16px' }
const text = { fontSize: '14px', color: '#c9c9cf', lineHeight: '1.5', margin: '0 0 20px' }
const codeStyle = {
  fontFamily: "'JetBrains Mono', Courier, monospace",
  fontSize: '32px',
  fontWeight: 'bold' as const,
  letterSpacing: '8px',
  color: '#FF2BD6',
  backgroundColor: '#140812',
  borderRadius: '10px',
  padding: '16px 0',
  textAlign: 'center' as const,
  margin: '0 0 28px',
}
const footer = { fontSize: '12px', color: '#8a8a92', margin: '28px 0 0' }
