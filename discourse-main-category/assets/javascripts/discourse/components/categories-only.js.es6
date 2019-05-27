export default Ember.Component.extend({
  didRender() {
    this._super(...arguments);
    this.$('.subcategories').addClass('hidden');
    $('.toggleBtn-cat').on('click',function (e) {
      e.preventDefault();
      $(this).parent().find('.subcategories').toggleClass('hidden');
    });
  }
});
