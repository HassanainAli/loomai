import * as React from 'react'
import { Body, Button, Container, Head, Heading, Html, Preview, Text } from '@react-email/components'
import type { TemplateEntry } from './registry'

interface Props {
  name?: string
  partnerName?: string
}

const MutualGreenlightEmail = ({ name, partnerName }: Props) => {
  const partner = partnerName || 'Your match'
  return (
    <Html lang="en" dir="ltr">
      <Head>
        <meta name="color-scheme" content="dark" />
        <meta name="supported-color-schemes" content="dark" />
      </Head>
      <Preview>{partner} green lit you back. Your chat is open.</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={brand}>loom<span style={dot}>.</span></Text>
          <Heading style={h1}>It's mutual.</Heading>
          <Text style={text}>
            {name ? `${name}, ` : ''}{partner} green lit you back. Your Focus Mode chat is open now.
          </Text>
          <Text style={text}>Chats close after 48 hours of quiet, so say hi while it's fresh.</Text>
          <Button href="https://tryloom.cc" style={button}>Open Loom</Button>
          <Text style={footer}>You're getting this because you green lit a match on Loom.</Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: MutualGreenlightEmail,
  subject: (d: Record<string, any>) => `${d['partnerName'] || 'Your match'} green lit you back`,
  displayName: 'Mutual green light',
  previewData: { name: 'Alex', partnerName: 'Maya' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "Inter, -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif", padding: '40px 0', margin: 0 }
const container = { backgroundColor: '#050505', borderRadius: '16px', padding: '32px 28px', maxWidth: '480px', margin: '0 auto', border: '1px solid rgba(255,43,214,0.35)' }
const brand = { fontSize: '32px', fontWeight: 900 as const, letterSpacing: '-0.05em', lineHeight: '1', color: '#ffffff', margin: '0 0 28px' }
const dot = { color: '#FACC15', fontWeight: 900 as const }
const h1 = { fontSize: '22px', fontWeight: 700 as const, letterSpacing: '-0.02em', color: '#ffffff', margin: '0 0 12px' }
const text = { fontSize: '14px', color: '#c9c9cf', lineHeight: '1.5', margin: '0 0 16px' }
const button = { backgroundColor: '#FF2BD6', color: '#050505', fontWeight: 700 as const, fontSize: '14px', borderRadius: '999px', padding: '12px 24px', textDecoration: 'none', display: 'inline-block', margin: '8px 0 0' }
const footer = { fontSize: '12px', color: '#8a8a92', margin: '28px 0 0' }
