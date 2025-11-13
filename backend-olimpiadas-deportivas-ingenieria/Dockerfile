# ---- Build stage ----
FROM eclipse-temurin:21-jdk AS build
WORKDIR /workspace

# Copy Maven wrapper & pom first for dependency resolution caching
COPY mvnw* ./
COPY .mvn .mvn
COPY pom.xml .

# Go offline to cache dependencies (skip tests for speed)
RUN ./mvnw -q -DskipTests dependency:go-offline

# Copy source
COPY src src

# Package application (skip tests to speed container build; enable if needed)
RUN ./mvnw -q -DskipTests package

# ---- Runtime stage ----
FROM eclipse-temurin:21-jre AS runtime
WORKDIR /app

# Optional: add non-root user (Render runs as root by default; uncomment if desired)
# RUN useradd -u 10001 spring && chown -R spring /app

# Copy built jar
ARG JAR_FILE=/workspace/target/*.jar
COPY --from=build ${JAR_FILE} app.jar

# Expose Spring Boot default port
EXPOSE 8080

# JVM tuning (adjust as needed)
ENV JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -XX:MinRAMPercentage=50.0"

# Enable faster startup & proper entropy source
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -Djava.security.egd=file:/dev/./urandom -jar app.jar"]
