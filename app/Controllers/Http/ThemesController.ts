import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import fs from 'fs-extra';
import Application from '@ioc:Adonis/Core/Application';
import path from 'node:path';
import { validator, schema } from '@ioc:Adonis/Core/Validator';
// import Drive from '@ioc:Adonis/Core/Drive';

const downloadSchema = schema.create({
  themeId: schema.string(),
});

export default class ThemesController {
  // List official and custom recipes
  public async list({ response }: HttpContextContract) {
    const officialThemes = fs.readJsonSync(
      path.join(Application.appRoot, 'themes', 'all.json'),
    );

    return response.send(officialThemes);
  }

  // Download a theme
  public async download({ response, params }: HttpContextContract) {
    // Validate user input
    let data;
    try {
      data = await validator.validate({
        data: params,
        schema: downloadSchema,
      });
    } catch (error) {
      return response.status(401).send({
        message: 'Please provide a theme ID',
        messages: error.messages,
        status: 401,
      });
    }

    const { themeId } = data;

    // Check for invalid characters
    if (/\.+/.test(themeId) || /\/+/.test(themeId)) {
      return response.send('Invalid theme name');
    }

    // Check if theme exists in theme folder
    const themePath = path.join(
      Application.appRoot,
      'themes',
      'archives',
      `${themeId}.tar.gz`,
    );

    if (await fs.exists(themePath)) {
      return (
        response
          .type('.tar.gz')
          .send(await fs.readFile(themePath))
      );
    }

    return response.status(400).send({
      message: 'Theme not found',
      code: 'theme-not-found',
    });
  }
}
