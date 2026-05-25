"""
Génération des factures PDF avec reportlab.
J'appelle generate_invoice_pdf(invoice) → bytes depuis les signals.
"""

from io import BytesIO
from django.utils import timezone
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import cm
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.enums import TA_LEFT, TA_RIGHT, TA_CENTER


# palette AfriSell
COLOR_PRIMARY = colors.HexColor('#FF6B35')
COLOR_DARK    = colors.HexColor('#1A1A2E')
COLOR_GRAY    = colors.HexColor('#6B7280')
COLOR_LIGHT   = colors.HexColor('#F9FAFB')


def generate_invoice_pdf(invoice) -> bytes:
    """Retourne le PDF en bytes — je le stocke ensuite dans invoice.pdf."""
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=2 * cm,
        leftMargin=2 * cm,
        topMargin=2 * cm,
        bottomMargin=2 * cm,
    )

    styles  = getSampleStyleSheet()
    story   = []
    payment = invoice.payment
    user    = payment.user
    plan    = payment.plan
    shop    = getattr(user, 'shop', None)

    # ── Header ────────────────────────────────────────────────────────────────

    header_style = ParagraphStyle('header', fontSize=22, textColor=COLOR_PRIMARY,
                                  fontName='Helvetica-Bold', spaceAfter=2)
    sub_style    = ParagraphStyle('sub', fontSize=9, textColor=COLOR_GRAY,
                                  fontName='Helvetica')

    story.append(Paragraph('AfriSell', header_style))
    story.append(Paragraph('Plateforme e-commerce pour l\'Afrique', sub_style))
    story.append(Spacer(1, 0.4 * cm))
    story.append(HRFlowable(width='100%', thickness=2, color=COLOR_PRIMARY))
    story.append(Spacer(1, 0.6 * cm))

    # ── Bloc facture + vendeur côte à côte ────────────────────────────────────

    invoice_info = [
        ['FACTURE', ''],
        [f'N° {invoice.number}', ''],
        [f'Date : {invoice.issued_at.strftime("%d/%m/%Y")}', ''],
        [f'Statut : Payée', ''],
    ]

    shop_name    = shop.name if shop else user.get_full_name() or user.username
    shop_country = shop.country if shop else ''
    client_info  = [
        ['CLIENT', ''],
        [shop_name, ''],
        [user.email, ''],
        [getattr(user, 'phone', '') or '', ''],
        [shop_country, ''],
    ]

    inv_style    = ParagraphStyle('inv_label', fontSize=8, textColor=COLOR_GRAY, fontName='Helvetica')
    inv_val_style = ParagraphStyle('inv_val', fontSize=10, fontName='Helvetica-Bold', textColor=COLOR_DARK)

    header_table = Table(
        [[
            Paragraph(f'<font size=8 color=grey>FACTURE</font><br/>'
                      f'<font size=14><b>N° {invoice.number}</b></font><br/>'
                      f'<font size=9 color=grey>Date : {invoice.issued_at.strftime("%d/%m/%Y")}</font><br/>'
                      f'<font size=9 color=grey>Statut : </font>'
                      f'<font size=9 color=green><b>Payée ✓</b></font>', styles['Normal']),
            Paragraph(f'<font size=8 color=grey>CLIENT</font><br/>'
                      f'<font size=12><b>{shop_name}</b></font><br/>'
                      f'<font size=9>{user.email}</font><br/>'
                      f'<font size=9>{getattr(user, "phone", "") or ""}</font>',
                      ParagraphStyle('right', alignment=TA_RIGHT)),
        ]],
        colWidths=['50%', '50%'],
    )
    header_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('BACKGROUND', (0, 0), (-1, -1), COLOR_LIGHT),
        ('PADDING', (0, 0), (-1, -1), 12),
        ('ROUNDEDCORNERS', [6]),
    ]))
    story.append(header_table)
    story.append(Spacer(1, 0.8 * cm))

    # ── Tableau détail ────────────────────────────────────────────────────────

    story.append(Paragraph(
        '<font size=10 color=grey>DÉTAIL DE LA COMMANDE</font>',
        ParagraphStyle('section', fontName='Helvetica', spaceAfter=6),
    ))

    interval_label = 'Annuel' if plan.interval == 'yearly' else 'Mensuel'
    provider_label = payment.get_provider_display() if hasattr(payment, 'get_provider_display') else payment.provider.title()

    detail_data = [
        ['Description', 'Période', 'Devise', 'Montant'],
        [
            f'Plan {plan.name} — AfriSell',
            interval_label,
            payment.currency,
            f'{payment.amount:,.0f} {payment.currency}',
        ],
    ]

    detail_table = Table(detail_data, colWidths=[8 * cm, 3 * cm, 2.5 * cm, 3.5 * cm])
    detail_table.setStyle(TableStyle([
        ('BACKGROUND',  (0, 0), (-1, 0),  COLOR_DARK),
        ('TEXTCOLOR',   (0, 0), (-1, 0),  colors.white),
        ('FONTNAME',    (0, 0), (-1, 0),  'Helvetica-Bold'),
        ('FONTSIZE',    (0, 0), (-1, 0),  9),
        ('ALIGN',       (3, 0), (3, -1),  'RIGHT'),
        ('BACKGROUND',  (0, 1), (-1, -1), COLOR_LIGHT),
        ('FONTSIZE',    (0, 1), (-1, -1), 9),
        ('GRID',        (0, 0), (-1, -1), 0.5, colors.HexColor('#E5E7EB')),
        ('PADDING',     (0, 0), (-1, -1), 8),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, COLOR_LIGHT]),
    ]))
    story.append(detail_table)
    story.append(Spacer(1, 0.4 * cm))

    # ── Total ─────────────────────────────────────────────────────────────────

    total_table = Table(
        [['', 'TOTAL', f'{payment.amount:,.0f} {payment.currency}']],
        colWidths=[8 * cm, 3 * cm + 2.5 * cm, 3.5 * cm],
    )
    total_table.setStyle(TableStyle([
        ('BACKGROUND',  (1, 0), (-1, 0), COLOR_PRIMARY),
        ('TEXTCOLOR',   (1, 0), (-1, 0), colors.white),
        ('FONTNAME',    (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE',    (0, 0), (-1, 0), 11),
        ('ALIGN',       (2, 0), (2, 0),  'RIGHT'),
        ('PADDING',     (0, 0), (-1, -1), 10),
    ]))
    story.append(total_table)
    story.append(Spacer(1, 0.8 * cm))

    # ── Mode de paiement ──────────────────────────────────────────────────────

    story.append(HRFlowable(width='100%', thickness=0.5, color=colors.HexColor('#E5E7EB')))
    story.append(Spacer(1, 0.4 * cm))
    story.append(Paragraph(
        f'<font size=8 color=grey>Mode de paiement : {payment.provider.title()} &nbsp;|&nbsp; '
        f'Référence : {payment.provider_tx_id or payment.provider_checkout_id}</font>',
        ParagraphStyle('footer_info', alignment=TA_CENTER),
    ))
    story.append(Spacer(1, 0.4 * cm))

    # ── Footer ────────────────────────────────────────────────────────────────

    story.append(HRFlowable(width='100%', thickness=0.5, color=colors.HexColor('#E5E7EB')))
    story.append(Spacer(1, 0.3 * cm))
    story.append(Paragraph(
        '<font size=7 color=grey>AfriSell — contact@afrisell.com — afrisell.com<br/>'
        'Ce document est une facture officielle générée automatiquement.</font>',
        ParagraphStyle('footer', alignment=TA_CENTER),
    ))

    doc.build(story)
    return buffer.getvalue()
