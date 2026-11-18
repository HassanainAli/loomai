import * as React from 'react'

import { Body, Container, Head, Heading, Html, Preview, Text } from '@react-email/components'

interface SignupEmailProps {
  siteName: string
  token: string
}

// Code-only on purpose: campus email scanners open links and burn one-time
// confirmation links before the student can. A typed code can't be consumed that way.
export const SignupEmail = ({ siteName, token }: SignupEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head>
      <meta name="color-scheme" content="dark" />
      <meta name="supported-color-schemes" content="dark" />
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&family=JetBrains+Mono:wght@700&display=swap" rel="stylesheet" />
    </Head>
    <Preview>Your {siteName} verification code: {token}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={brand}>loom<span style={dot}>.</span></Text>
        <Heading style={h1}>Verify your student email</Heading>
        <Text style={text}>Enter this code in Loom to finish creating your account.</Text>
        <Text style={codeStyle}>{token}</Text>
        <Text style={footer}>
          This code expires in 15 minutes. Never share it with anyone, Loom will never ask for it. If you didn't sign up for Loom, you can ignore this email.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default SignupEmail

const main = { backgroundColor: '#050505', fontFamily: "Inter, -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif", padding: '40px 0', margin: 0 }
const container = { backgroundColor: '#050505', borderRadius: '16px', padding: '32px 28px', maxWidth: '480px', margin: '0 auto', border: '1px solid rgba(255,43,214,0.35)', boxShadow: '0 0 32px rgba(255,43,214,0.18)' }
const brand = { fontFamily: "Inter, -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif", fontSize: '32px', fontWeight: 900 as const, letterSpacing: '-0.05em', lineHeight: '1', color: '#ffffff', margin: '0 0 28px' }
const dot = { color: '#FACC15', fontWeight: 900 as const }
const h1 = { fontSize: '22px', fontWeight: 700 as const, letterSpacing: '-0.02em', color: '#ffffff', margin: '0 0 12px' }
const text = { fontSize: '14px', color: '#c9c9cf', lineHeight: '1.5', margin: '0 0 20px' }
const codeStyle = {
  fontFamily: "'JetBrains Mono', Courier, monospace",
  fontSize: '32px',
  fontWeight: 'bold' as const,
  letterSpacing: '8px',
  color: '#FF2BD6',
  backgroundColor: '#140812',
  border: '1px solid rgba(255,43,214,0.25)',
  borderRadius: '10px',
  padding: '16px 0',
  textAlign: 'center' as const,
  margin: '0 0 28px',
}
const footer = { fontSize: '12px', color: '#8a8a92', margin: '28px 0 0' }
