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
          This code expires soon. If you didn't ask to reset your password, you
          can ignore this email. Your password won't change.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default RecoveryEmail

const main = { backgroundColor: '#ffffff', fontFamily: 'Inter, Arial, sans-serif' }
const container = { padding: '24px 28px' }
const brand = { fontSize: '28px', fontWeight: 900 as const, color: '#000000', margin: '0 0 24px' }
const dot = { color: '#FACC15' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#000000', margin: '0 0 16px' }
const text = { fontSize: '14px', color: '#55575d', lineHeight: '1.5', margin: '0 0 20px' }
const codeStyle = {
  fontFamily: "'JetBrains Mono', Courier, monospace",
  fontSize: '32px',
  fontWeight: 'bold' as const,
  letterSpacing: '8px',
  color: '#FF2BD6',
  margin: '0 0 28px',
}
const footer = { fontSize: '12px', color: '#999999', margin: '28px 0 0' }
