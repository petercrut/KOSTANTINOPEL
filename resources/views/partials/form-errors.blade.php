@if (isset($errors) && $errors->any())
  <div class="alert alert-error">
    <strong>Periksa kembali data berikut:</strong>
    <ul>
      @foreach ($errors->all() as $message)
        <li>{{ $message }}</li>
      @endforeach
    </ul>
  </div>
@endif
