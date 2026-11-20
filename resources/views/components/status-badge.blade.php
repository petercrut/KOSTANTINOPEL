@props(['status', 'group' => null, 'label' => null])
<span class="badge badge-{{ $status }}">{{ $label ?? ($group ? \App\Support\Labels::label($group, $status) : ucfirst($status)) }}</span>
