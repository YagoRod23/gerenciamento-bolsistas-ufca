from django.db import models

class Modalidade(models.TextChoices):
    BASQUETE = 'Basquete', 'Basquete'
    FUTSAL = 'Futsal', 'Futsal'
    HANDEBOL = 'Handebol', 'Handebol'
    VOLEI = 'Vôlei', 'Vôlei'
    ATLETISMO = 'Atletismo', 'Atletismo'

# Lista de cursos disponíveis
CURSO_CHOICES = [
    ('ADM', 'Administração'),
    ('ADM_PUB', 'Administração Pública'),
    ('AGR', 'Agronomia'),
    ('BIO', 'Biologia'),
    ('BIB', 'Biblioteconomia'),
    ('COMP', 'Ciência da Computação'),
    ('CONT', 'Ciências Contábeis'),
    ('DES', 'Design'),
    ('ENG_CIV', 'Engenharia Civil'),
    ('ENG_MAT', 'Engenharia de Materiais'),
    ('FILO', 'Filosofia'),
    ('FIS', 'Física'),
    ('JOR', 'Jornalismo'),
    ('LET_LIB', 'Letras - Libras'),
    ('MAT', 'Matemática'),
    ('MAT_COMP', 'Matemática Computacional'),
    ('MED', 'Medicina'),
    ('VET', 'Medicina Veterinária'),
    ('MUS', 'Música'),
    ('QUI', 'Química'),
]
#Lista de turnos disponiveis para treinamento
TURNO_CHOICES = [
    ('MANHA','Manhã'),
    ('TARDE','Tarde'),
    ('NOITE','Noite'),
]

# Modelo Bolsista
class Bolsista(models.Model):
    nome = models.CharField(max_length=100)
    modalidade = models.CharField(max_length=50, choices=Modalidade.choices)
    curso = models.CharField(max_length=50, choices=CURSO_CHOICES)
    data_inicio_bolsa = models.DateField()
    data_fim_bolsa = models.DateField()
    ano = models.IntegerField()

    def __str__(self):
        return self.nome

# Modelo Participante
class Participante(models.Model):
    nome = models.CharField(max_length=100)
    turno = models.CharField(max_length=50, choices=TURNO_CHOICES, verbose_name="Turno disponível para treino")
    competidor = models.BooleanField(default=False)
    carga_horaria = models.IntegerField()
    data_nascimento = models.DateField()
    curso = models.CharField(max_length=50, choices=CURSO_CHOICES)
    semestre = models.IntegerField()
    modalidade = models.CharField(max_length=50, choices=Modalidade.choices)

    def __str__(self):
        return self.nome

# Modelo Frequencia
class Frequencia(models.Model):
    bolsista = models.ForeignKey(Bolsista, on_delete=models.CASCADE)
    mes = models.CharField(max_length=50)
    frequencia_entregue = models.BooleanField(default=False)
    frequencia_participantes_entregue = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.bolsista.nome} - {self.mes}"
