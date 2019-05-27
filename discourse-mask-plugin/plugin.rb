# name: name-mask
# about: Masks usernames under most_liked_section
# version: 1.0
# authors: İbrahim AVCI


enabled_site_setting :name_mask_enabled

register_asset "stylesheets/common/base/menu-panel.scss"
load File.expand_path('javascripts/discourse/helpers/name-mask.js.es6', __FILE__)
register_asset "javascripts/discourse/templates/components/user-info.hbs"







