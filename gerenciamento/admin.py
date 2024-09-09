from django.contrib import admin
from .models import Bolsista, Participante, Frequencia

class FrequenciaAdmin(admin.ModelAdmin):
    list_display = ('bolsista', 'mes', 'frequencia_entregue', 'frequencia_participantes_entregue')
    list_filter = ('mes', 'bolsista',)
    search_fields = ['bolsista__nome']
    list_editable = ('frequencia_entregue', 'frequencia_participantes_entregue')

class ParticipanteAdmin(admin.ModelAdmin):
    list_display = ('nome', 'modalidade', 'curso')  # Adiciona as colunas visíveis na listagem
    list_filter = ('modalidade', 'curso', 'competidor')  # Adiciona filtros por modalidade e curso
 

admin.site.register(Bolsista)
admin.site.register(Participante, ParticipanteAdmin)  # Certifique-se de registrar o admin com o ParticipanteAdmin
admin.site.register(Frequencia, FrequenciaAdmin)


#É ESSA PAGINA ONDE EU CONSIGO GERENCIAR OS FILTROS DE PESQUISA