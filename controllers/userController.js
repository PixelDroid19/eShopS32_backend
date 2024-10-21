const db = require("../config/db");

// Controlador para actualizar la configuración del usuario y devolver la configuración actualizada
exports.updateConfig = (req, res) => {
  const userId = req.params.id;

  // Primero obtenemos los valores actuales de la configuración
  const getCurrentConfigQuery = `SELECT * FROM shop_cuentas WHERE id = ?`;

  db.query(getCurrentConfigQuery, [userId], (err, result) => {
    if (err) {
      return res
        .status(500)
        .json({ message: "Error al obtener la configuración actual" });
    }

    if (result.length === 0) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    // Valores actuales de la configuración
    const currentConfig = result[0];

    // Valores que se enviaron desde el frontend o se mantienen los actuales
    const {
      title = currentConfig.title,
      backgroundColor = currentConfig.backgroundColor,
      headerColor = currentConfig.headerColor,
      headerTextColor = currentConfig.headerTextColor,
      textColor = currentConfig.textColor,
      primaryColor = currentConfig.primaryColor,
      secondaryColor = currentConfig.secondaryColor,
      buttonColor = currentConfig.buttonColor,
      buttonTextColor = currentConfig.buttonTextColor,
      buttonHoverOpacity = currentConfig.buttonHoverOpacity,
      buttonFontSize = currentConfig.buttonFontSize,
      buttonBorderRadius = currentConfig.buttonBorderRadius,
      asideColor = currentConfig.asideColor,
      logo = currentConfig.logo,
      language = currentConfig.language,
      mainFont = currentConfig.mainFont,
      whatsappNumber = currentConfig.whatsappNumber,
      description = currentConfig.description,
      footer = req.body.footer || {},
      landingPage = req.body.landingPage || {},
    } = req.body;

    // Extraer address, email y phone del objeto contact en footer
    const address = footer.contact?.address || currentConfig.address;
    const email = footer.contact?.email || currentConfig.email;
    const phone = footer.contact?.phone || currentConfig.phone;

    // Extraer redes sociales
    const facebook = footer.socialLinks?.find(link => link.name === 'Facebook')?.url || currentConfig.facebook;
    const twitter = footer.socialLinks?.find(link => link.name === 'Twitter')?.url || currentConfig.twitter;
    const instagram = footer.socialLinks?.find(link => link.name === 'Instagram')?.url || currentConfig.instagram;

    // Extraer configuración de la página de inicio
    const heroBgGradient = landingPage.heroBgGradient || currentConfig.heroBgGradient;
    const heroTextColor = landingPage.heroTextColor || currentConfig.heroTextColor;
    const heroTitle = landingPage.heroTitle || currentConfig.heroTitle;
    const heroSubtitle = landingPage.heroSubtitle || currentConfig.heroSubtitle;
    const heroButtonText = landingPage.heroButtonText || currentConfig.heroButtonText;
    const heroButtonColorScheme = landingPage.heroButtonColorScheme || currentConfig.heroButtonColorScheme;
    const heroImage = landingPage.heroImage || currentConfig.heroImage;
    const featuresTitle = landingPage.featuresTitle || currentConfig.featuresTitle;
    const featuresSubtitle = landingPage.featuresSubtitle || currentConfig.featuresSubtitle;
    const features = landingPage.features || currentConfig.features;

    // Query para actualizar la configuración
    const updateConfigQuery = `
            UPDATE shop_cuentas
            SET title = ?, backgroundColor = ?, headerColor = ?, headerTextColor = ?,
                textColor = ?, primaryColor = ?, secondaryColor = ?, buttonColor = ?, 
                buttonTextColor = ?, buttonHoverOpacity = ?, buttonFontSize = ?, 
                buttonBorderRadius = ?, asideColor = ?, logo = ?, language = ?, 
                mainFont = ?, address = ?, phone = ?, email = ?, facebook = ?, 
                instagram = ?, twitter = ?, whatsappNumber = ?, heroBgGradient = ?, 
                heroTextColor = ?, heroTitle = ?, heroSubtitle = ?, heroButtonText = ?, 
                heroButtonColorScheme = ?, heroImage = ?, featuresTitle = ?, 
                featuresSubtitle = ?, features = ?, description = ?
            WHERE id = ?`;

    const params = [
      title,
      backgroundColor,
      headerColor,
      headerTextColor,
      textColor,
      primaryColor,
      secondaryColor,
      buttonColor,
      buttonTextColor,
      buttonHoverOpacity,
      buttonFontSize,
      buttonBorderRadius,
      asideColor,
      logo,
      language,
      mainFont,
      address,
      phone,
      email,
      facebook,
      instagram,
      twitter,
      whatsappNumber,
      heroBgGradient,
      heroTextColor,
      heroTitle,
      heroSubtitle,
      heroButtonText,
      heroButtonColorScheme,
      heroImage,
      featuresTitle,
      featuresSubtitle,
      features,
      description,
      userId,
    ];

    // Ejecutar la actualización en la base de datos
    db.query(updateConfigQuery, params, (err, result) => {
      if (err) {
        console.error('Error en la consulta de actualización:', err);
        return res
          .status(500)
          .json({ message: "Error al actualizar la configuración" });
      }

      // Después de actualizar, obtenemos los valores actualizados
      db.query(getCurrentConfigQuery, [userId], (err, updatedResult) => {
        if (err) {
          return res
            .status(500)
            .json({ message: "Error al obtener la configuración actualizada" });
        }

        // Enviar la configuración actualizada al frontend
        res.json({
          message: "Configuración actualizada correctamente",
          updatedConfig: updatedResult[0],
        });
      });
    });
  });
};

exports.getUserData = (req, res) => {
  res.json({ message: "Aquí están tus datos", user: req.user });
};
