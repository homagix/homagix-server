const html = /* html */`<p>Hallo {{ user.firstName }},</p>

<p>Du hast offenbar Dein Passwort für {{{ baseUrl }}} vergessen und einen Zugangslink bestellt, über den Du Dir ein neues Passwort setzen kannst.</p>

<p><a href="{{{ baseUrl }}}/accounts/{{ user.id }}/access-codes/{{ user.accessCode }}">Hier ist er</a></p>

<p>Viele Grüße,<br>
Dein Team von {{{ baseUrl }}}</p>
`

export default {
  subject: 'Dein Zugang zu {{{ baseUrl }}}',
  html,
}
