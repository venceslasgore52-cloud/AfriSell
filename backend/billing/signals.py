from django.dispatch import Signal, receiver

# signaux pour découpler billing des autres apps
# orders, studio, sira, notifications s'abonnent ici sans toucher à billing
subscription_activated = Signal()
subscription_cancelled = Signal()
subscription_expired   = Signal()
payment_succeeded      = Signal()
payment_failed         = Signal()


@receiver(subscription_activated)
def on_subscription_activated(sender, subscription, **kwargs):
    from .models import Payment, Invoice

    # je cherche le dernier paiement réussi lié à cet abonnement
    last_payment = (
        Payment.objects
        .filter(user=subscription.user, status='success')
        .order_by('-created_at')
        .first()
    )
    if not last_payment:
        return

    # je crée la facture si elle n'existe pas encore
    if not hasattr(last_payment, 'invoice'):
        invoice = Invoice.objects.create(
            payment=last_payment,
            number=Invoice.generate_number(),
        )
        # je génère le PDF en arrière-plan pour ne pas bloquer le webhook
        from .tasks import generate_invoice_pdf_task
        generate_invoice_pdf_task.delay(str(invoice.id))
