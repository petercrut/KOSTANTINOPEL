@if ($paginator->hasPages())
  <nav class="pagination" aria-label="Navigasi halaman">
    <span class="page-info">
      Menampilkan {{ $paginator->firstItem() }}–{{ $paginator->lastItem() }} dari {{ $paginator->total() }}
    </span>
    @if ($paginator->onFirstPage())
      <span class="page-link disabled" aria-disabled="true">‹</span>
    @else
      <a class="page-link" href="{{ $paginator->previousPageUrl() }}" rel="prev" aria-label="Sebelumnya">‹</a>
    @endif

    @foreach ($paginator->getUrlRange(max(1, $paginator->currentPage() - 2), min($paginator->lastPage(), $paginator->currentPage() + 2)) as $page => $url)
      @if ($page === $paginator->currentPage())
        <span class="page-link active" aria-current="page">{{ $page }}</span>
      @else
        <a class="page-link" href="{{ $url }}">{{ $page }}</a>
      @endif
    @endforeach

    @if ($paginator->hasMorePages())
      <a class="page-link" href="{{ $paginator->nextPageUrl() }}" rel="next" aria-label="Berikutnya">›</a>
    @else
      <span class="page-link disabled" aria-disabled="true">›</span>
    @endif
  </nav>
@endif
