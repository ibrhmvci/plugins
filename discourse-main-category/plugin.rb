# name: main-category
# about: This plugin creates dropdown buttuon for subcategories on the main page
# version: 1.0
# authors: Ibrahim AVCI


enabled_site_setting :main_category_enabled

register_asset "javascripts/discourse/components/categories-only.js.es6"
register_asset "javascripts/discourse/templates/components/categories-only.hbs"

