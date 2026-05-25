from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/',              admin.site.urls),
    path('api/accounts/',       include('accounts.urls')),
    path('api/billing/',        include('billing.urls')),
    path('api/catalogue/',      include('catalogue.urls')),
    path('api/orders/',         include('orders.urls')),
    path('api/notifications/',  include('notifications.urls')),
    path('api/analytics/',      include('analytics.urls')),
    path('api/sira/',           include('sira.urls')),
    path('api/studio/',         include('studio.urls')),
]

# je sers les fichiers médias en développement
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
