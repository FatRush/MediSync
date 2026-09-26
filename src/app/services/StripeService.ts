// src/app/services/stripe.service.ts
import { Injectable } from '@angular/core';
import { loadStripe, Stripe, StripeElements } from '@stripe/stripe-js';

@Injectable({
  providedIn: 'root'
})
export class StripeService {
  private stripePromise = loadStripe('pk_test_TU_CLAVE_PUBLICABLE_DE_STRIPE');
  private stripe: Stripe | null = null;
  private elements: StripeElements | null = null;

  async initStripe() {
    this.stripe = await this.stripePromise;
  }

  // Montar el formulario de tarjeta en un <div> HTML
  async crearFormularioPago(elementId: string) {
    if (!this.stripe) await this.initStripe();
    
    this.elements = this.stripe!.elements();
    const cardElement = this.elements.create('card', {
      style: {
        base: {
          fontSize: '16px',
          color: '#32325d',
        },
      },
    });
    
    cardElement.mount(`#${elementId}`);
    return cardElement;
  }

  // Procesar el pago con el clientSecret recibido de la Cloud Function
  async confirmarPago(clientSecret: string, cardElement: any) {
    if (!this.stripe) return null;

    return await this.stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: cardElement,
      },
    });
  }
}