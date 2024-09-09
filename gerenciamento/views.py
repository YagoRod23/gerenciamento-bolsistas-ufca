from django.http import HttpResponse
from django.shortcuts import render
from .models import Participante

def index(request):
    return HttpResponse("Hello, this is the index page of gerenciamento.")


# Nova view para listar participantes
def lista_participantes(request):
    modalidade_selecionada = request.GET.get('modalidade')  # Obtém a modalidade selecionada no front-end
    if modalidade_selecionada:
        participantes = Participante.objects.filter(modalidade=modalidade_selecionada)
    else:
        participantes = Participante.objects.all()
    
    modalidades = Participante.objects.values_list('modalidade', flat=True).distinct()  # Lista de modalidades para o filtro
    
    return render(request, 'participantes.html', {
        'participantes': participantes,
        'modalidades': modalidades,
        'modalidade_selecionada': modalidade_selecionada,
    })
