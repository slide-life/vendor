function updatePage(target) {
  $('.page').html($('#' + target).html());
}

(function($) {
  $('.sidebar .link').on('click', function () {
    var target = $(this).data('target');
    updatePage(target);

    $(this).siblings().removeClass('active');
    $(this).addClass('active');
  });

  updatePage($('.sidebar .link.active').data('target'));

  $(document).on('click', '.data-table tbody td', function () {
    $('.data-table tbody tr').removeClass('selected');
    $(this).parent().addClass('selected');
  });
})($);
