from django import template

register = template.Library()

@register.filter(name='zip')
def zip_lists():
  my_list = ['ndfdMaxT','radar']
  return my_list
