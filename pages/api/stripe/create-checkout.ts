import { NextApiRequest, NextApiResponse } from 'next';
import { stripe } from '@/lib/stripe';

interface CartItem {
  id?: string;
  stripeId?: string;
  quantity: number;
  title: string;
  image: string;
  price: number;
  handle: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { items, utmParams, customerEmail }: { items: CartItem[], utmParams?: any, customerEmail?: string } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Items são obrigatórios' });
    }

    const origin = req.headers.origin || 'https://theperfumeuk.shop';

    // Extrair dados do cliente para rastreamento (Facebook CAPI + TikTok CAPI)
    const fbp = req.cookies._fbp || '';
    const fbc = req.cookies._fbc || '';
    const ttp = req.cookies._ttp || '';
    const ttclid = req.cookies.ttclid || '';
    const userAgent = req.headers['user-agent'] || '';
    const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.socket.remoteAddress || '';

    // Total exato em centavos
    const totalPriceFloat = items.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);
    const totalCents = Math.round(totalPriceFloat * 100);
    const totalQty = items.reduce((sum, item) => sum + item.quantity, 0);

    // Nome do line item baseado na quantidade
    let lineName: string;
    if (totalQty >= 2) {
      lineName = `Bundle ${totalQty} perfumes`;
    } else {
      lineName = items[0]?.title || 'Perfume';
    }

    // Um único line item garante preço exato sem erros de arredondamento
    const lineItems = [{
      price_data: {
        currency: 'usd',
        product_data: {
          name: lineName,
          metadata: {
            handles: items.map(i => i.handle).join(','),
            originalStripeIds: items.map(i => i.stripeId || '').join(','),
          }
        },
        unit_amount: totalCents,
      },
      quantity: 1
    }];

    // IDs dos produtos para CAPI (mesmo ID usado nos browser pixel events)
    const contentIds = items.map(i => i.id || i.handle).filter(Boolean).join(',');
    const productNames = items.map(i => i.title).filter(Boolean).join(',');

    // Criar sessão de checkout
    // @ts-ignore - automatic_payment_methods existe na API mas o TS pode estar desatualizado
    const session = await stripe.checkout.sessions.create({
      line_items: lineItems,
      mode: 'payment',
      ui_mode: 'embedded',
      customer_email: customerEmail && customerEmail.trim() !== '' ? customerEmail : undefined, // Pre-fill email se fornecido
      return_url: `${origin}/checkout/return?session_id={CHECKOUT_SESSION_ID}`,
      shipping_address_collection: {
        allowed_countries: ['US'],
      },
      phone_number_collection: {
        enabled: true,
      },
      payment_method_types: ['card'],
      metadata: {
        utm_campaign: utmParams?.utm_campaign || '',
        utm_source: utmParams?.utm_source || '',
        utm_medium: utmParams?.utm_medium || '',
        utm_content: utmParams?.utm_content || '',
        utm_term: utmParams?.utm_term || '',
        src: utmParams?.src || '',
        sck: utmParams?.sck || '',
        xcod: utmParams?.xcod || '',
        content_ids: contentIds.substring(0, 500),
        fbp,
        fbc,
        ttp,
        ttclid,
        user_agent: userAgent.substring(0, 500),
        client_ip: clientIp
      }
    } as any);

    return res.status(200).json({ clientSecret: session.client_secret });

  } catch (error) {
    console.error('❌ Erro:', error);
    return res.status(500).json({
      error: 'Erro interno',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
}
