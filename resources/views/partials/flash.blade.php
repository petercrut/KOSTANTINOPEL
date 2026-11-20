<div id="toast-container">
  @if (session('status'))
    <div class="toast toast-success" data-autohide>
      <span class="toast-icon">✓</span>
      <span class="toast-msg">{{ session('status') }}</span>
    </div>
  @endif
  @if (session('error'))
    <div class="toast toast-error" data-autohide>
      <span class="toast-icon">✕</span>
      <span class="toast-msg">{{ session('error') }}</span>
    </div>
  @endif
  @if (isset($errors) && $errors->any())
    <div class="toast toast-error" data-autohide>
      <span class="toast-icon">✕</span>
      <span class="toast-msg">{{ $errors->first() }}</span>
    </div>
  @endif
</div>
